// Constantes para valores das peças
const PIECE_VALUES = {
    pawn: 20,  // Valor do peão
    king: 60,  // Valor do rei
    promotion: 40  // Valor adicional para promoção
};

// Função para avaliar o valor de um movimento
const evaluateMove = (move, penambah = 0) => {
    let sum = 0;

    // Avalia a remoção de uma peça
    if ('remove' in move) {
        const pieceType = move["removePiece"][1].toLowerCase();
        sum += (pieceType === "p" ? PIECE_VALUES.pawn : PIECE_VALUES.king) + penambah;
    }

    // Avalia a promoção de um peão
    if ('promote' in move) {
        sum += PIECE_VALUES.promotion;
    }

    // Avalia a sequência de capturas
    if ('nextEat' in move) {
        sum += evaluateMove(move.nextEat); // Recursão para avaliar capturas em sequência
    }

    return sum;
};

// Função Minimax com poda Alpha-Beta
const minmax = (position, depth, alpha, beta, isMaximizingPlayer, sum, turn, color) => {
    jumlahNode++;  // Incrementa o contador de nós avaliados
    let moves = getAllMoves(turn, position)  // Obtém todos os movimentos possíveis
        .reduce((arr, m) => {
            spreadNextEat(m).forEach(m2 => arr.push(m2));  // Espalha capturas em sequência
            return arr;
        }, []);

    // Ordena movimentos para avaliar primeiro os mais promissores
    moves.sort((a, b) => evaluateMove(b) - evaluateMove(a));

    // Condição de término da recursão
    if (depth === 0 || moves.length === 0) {
        return [null, sum];
    }

    let bestMove = null;
    let bestValue = isMaximizingPlayer ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    // Itera sobre todos os movimentos possíveis
    for (let move of moves) {
        let newSum = sum + (turn === color ? evaluateMove(move, depth) : -evaluateMove(move, depth));
        let newPos = position;
        let nextMove = move;

        // Processa a sequência de capturas
        while ('nextEat' in nextMove) {
            newPos = movePiece(nextMove, newPos);
            nextMove = nextMove.nextEat;
        }

        newPos = movePiece(nextMove, newPos);

        // Penaliza ou bonifica movimentos de peões
        if (move['piece'][1].toLowerCase() === "p") {
            const row = move['from'][1];
            if ((row === 1 && turn === "white") || (row === 8 && turn === "black")) {
                newSum -= 10;  // Penaliza se o peão está em uma posição inicial
            } else {
                newSum += 10;  // Bonifica se o peão avançou
            }
        }

        const newTurn = turn === "white" ? "black" : "white";

        // Recursão Minimax
        const [, childValue] = minmax(newPos, depth - 1, alpha, beta, !isMaximizingPlayer, newSum, newTurn, color);

        // Atualiza o melhor valor e movimento para o jogador maximizador
        if (isMaximizingPlayer) {
            if (childValue > bestValue) {
                bestValue = childValue;
                bestMove = move;
            }
            alpha = Math.max(alpha, bestValue);
        } else {
            // Atualiza o melhor valor e movimento para o jogador minimizador
            if (childValue < bestValue) {
                bestValue = childValue;
                bestMove = move;
            }
            beta = Math.min(beta, bestValue);
        }

        // Poda Alpha-Beta
        if (alpha >= beta) {
            break;
        }
    }

    return [bestMove, bestValue];
};
