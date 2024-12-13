// Utilitário Geral
const getNextChar = (c, move = 1) => String.fromCharCode(c.charCodeAt(0) + move);

const combineHurufAngka = (huruf, angka) => {
    return huruf.reduce((arr, h) => {
        angka.forEach(a => {
            arr.push(h + a);
        })
        return arr;
    }, []);
}

// Mudar cor de Quadrado
const greySquare = square => $(`#${tagBoard} .square-${square}`).addClass('gray');
const highlightSquare = square => $(`#${tagBoard} .square-${square}`).addClass("highlight");
const removeGreySquares = () => $(`#${tagBoard} .square-55d63`).removeClass('gray');
const removeHighlightSquare = () => $(`#${tagBoard} .highlight`).removeClass('highlight');

// Utilitário Tabuleiro de Xadrez

// Verifica se a peça clicada pode se mover
const canMove = (piece) => {
    if (!turn || twoComputer)
        return false;
    if ((turn === 'white' && piece.search(/^w/) === -1) ||
        (turn === 'black' && piece.search(/^b/) === -1)) {
        return false
    }
    return true;
}

// Verifica se o quadrado está vazio
const isEmptySquare = (square, board) => {
    if (!(square in board)) return true;
    return false;
}

// Verifica se o movimento é válido
const isValidMove = (from, to, moves) => {
    const move = moves.filter(m => m.from == from && m.to == to);
    if (move.length > 0)
        return true;
    return false;
};

// Capturar peça adversária
const eat = (removeSquare, currPos) => {
    delete currPos[removeSquare];
    return currPos;
}

// ============= Funções de Movimento =========
// Movimento horizontal
const getMovesKingLeftRight = (batas, i, j, k, pieces, currBoard, plus) => {
    let newS;
    let newSquare = [];
    let jRemove = undefined;
    let kRemove = undefined;

    while (batas(i) && (j >= 1 || k <= 8)) {
        if (j >= 1) {
            newS = i + j;
            if (isEmptySquare(newS, currBoard)) {
                const tmp = {
                    to: newS
                };
                if (jRemove) {
                    tmp["remove"] = jRemove;
                    tmp["removePiece"] = currBoard[jRemove];
                }
                newSquare.push(tmp);
            } else {
                if (currBoard[newS][0] == pieces[0]) j = 0;
                if (!jRemove) jRemove = newS;
                else j = 0;
            }
            j--;
        }

        if (k <= 8) {
            newS = i + k;
            if (isEmptySquare(newS, currBoard)) {
                const tmp = {
                    to: newS
                };
                if (kRemove) {
                    tmp["remove"] = kRemove;
                    tmp["removePiece"] = currBoard[kRemove];
                }
                newSquare.push(tmp);
            } else {
                if (currBoard[newS][0] == pieces[0]) k = 9;
                if (!kRemove) kRemove = newS;
                else k = 9
            }
            k++;
        }
        i = getNextChar(i, plus);
    }
    return newSquare;
}

// Movimento da Rainha
const getKingMoves = (square, pieces, currBoard) => {
    const [huruf, angka] = [...square];
    let j = parseInt(angka) - 1;
    let k = parseInt(angka) + 1;
    let newSquare = [];

    getMovesKingLeftRight(i => i >= "a", getNextChar(huruf, -1), j, k, pieces, currBoard, -1)
        .forEach(m => newSquare.push(m));
    getMovesKingLeftRight(i => i <= "h", getNextChar(huruf, 1), j, k, pieces, currBoard, 1)
        .forEach(m => newSquare.push(m));
    return newSquare
        .reduce((arr, m) => {
            arr.push({
                ...m,
                color: pieces[0],
                piece: pieces,
                from: square,
            });
            return arr;
        }, []);
}

// Movimento do Peão
const getPawnMoves = (square, pieces, currBoard) => {
    const [huruf, angka] = [...square];
    const newAngka = [];
    const newHuruf = [];
    const cor = pieces[0];

    if (angka > 1 && (cor == "b" || (cor == "w" && backMove))) newAngka.push(angka - 1);
    if (angka < 8 && (cor == "w" || (cor == "b" && backMove))) newAngka.push(parseInt(angka) +
        1);
    if (huruf > 'a') newHuruf.push(getNextChar(huruf, -1));
    if (huruf < 'h') newHuruf.push(getNextChar(huruf, 1));

    return combineHurufAngka(newHuruf, newAngka)
        .reduce((arr, s) => {
            const m = {
                color: pieces[0],
                piece: pieces,
                from: square,
                to: s
            };
            if (isEmptySquare(m.to, currBoard)) {
                if (!backMove)
                    arr.push(m)
            } else if (currBoard[m.to][0] != pieces[0]) {
                const eatMove = getMovesEat(square, m.to, pieces, currBoard);
                if (eatMove)
                    arr.push(eatMove);
            }
            return arr;
        }, []);
}

// Movimento de captura para o Peão
const getMovesEat = (currSquare, nextSquare, pieces, currBoard) => {
    const [huruf, angka] = [...currSquare];
    const [h, a] = [...nextSquare];

    let newA;

    if (pieces[0] == "w") {
        if (a > angka && a < 8) newA = parseInt(a) + 1;
        else if (a < angka && backMove && a > 1) newA = parseInt(a) - 1;
    } else if (pieces[0] == "b") {
        if (a < angka && a > 1) newA = parseInt(a) - 1;
        else if (a > angka && backMove && a < 8) newA = parseInt(a) + 1;
    }

    if (newA) {
        let newSquare;
        if (h > huruf && h < "h") newSquare = getNextChar(h, 1) + newA;
        else if (h < huruf && h > "a") newSquare = getNextChar(h, -1) + newA;
        if (newSquare && isEmptySquare(newSquare, currBoard)) {
            return {
                color: pieces[0],
                piece: pieces,
                from: currSquare,
                to: newSquare,
                remove: nextSquare,
                removePiece: currBoard[nextSquare]
            };
        }
    }
    return;
}

const spreadNextEat = move => {
    if ("nextEat" in move) {
        const newMove = [];
        let nextEat = [];
        move.nextEat.forEach(m => {
            spreadNextEat(m)
                .forEach(m2 => nextEat.push(m2));
        });

        delete move.nextEat;
        nextEat.forEach(m => {
            newMove.push({
                ...move,
                nextEat: m
            })
        })
        return newMove;
    }
    return [move];
}

// Obter movimentos
const getMoves = (square, pieces = null, currBoard = null, recur = false) => {
    if (!currBoard)
        currBoard = positionNow;

    if (!pieces) {
        pieces = currBoard[square];
        if (!pieces) return [];
    }

    if (!recur) {
        if (hasHighlight && squareHighlighted != square) return [];
    }

    let moves;

    if (pieces[1].toLowerCase() == "p") moves = getPawnMoves(square, pieces, currBoard);
    else moves = getKingMoves(square, pieces, currBoard);

    moves.forEach(m => {
        if (isPromoted(m.to, pieces)) m['promote'] = pieces;
    })

    if (hasHighlight)
        return moves
            .filter(m => "remove" in m);
    return moves;
}

// Obter movimentos com continuação
const getMovesRecur = (square, pieces = null, currBoard = null) => {
    if (!currBoard) {
        currBoard = positionNow;
    }

    if (!pieces) {
        pieces = currBoard[square];
        if (!pieces) return [];
    }

    const moves = getMoves(square, pieces, currBoard, true);
    moves.forEach(m => {
        if ("remove" in m) {
            let newPos = movePiece(m, currBoard);
            let newPiece = m.piece;

            if ("promote" in m) {
                if (newPiece[0] == "w") newPiece = "wQ";
                else newPiece = "bQ";
            }

            if (hasAnotherEat(m.to, newPiece, false, newPos)) {
                const nextEat = getMovesRecur(m.to, newPiece, newPos)
                    .filter(m2 => "remove" in m2);

                if (nextEat.length > 0)
                    m["nextEat"] = nextEat;
            }
            squareHighlighted = undefined;
            backMove = false;
            hasHighlight = false;
        }

    });
    return moves;
}

// Verificar se ainda existem capturas possíveis
const hasAnotherEat = (square, pieces, highlightSquare2 = true, position = null) => {

    if (highlightSquare2)
        removeHighlightSquare();

    backMove = true;
    squareHighlighted = square;
    if (highlightSquare2)
        highlightSquare(square);
    hasHighlight = true;
    const moves = getMoves(square, pieces, position);

    if (moves.length == 0) {
        squareHighlighted = undefined;
        backMove = false;
        hasHighlight = false;
        if (highlightSquare2)
            removeHighlightSquare();
        return false;
    }
    return true;
}

// Verifica se houve promoção de peça
const isPromoted = (target, pieces) => {
    if (pieces[1].toLowerCase() != "p")
        return false;
    if (pieces[0] == "w" && target[1] == 8)
        return true;
    if (pieces[0] == "b" && target[1] == 1)
        return true;
    return false;
}

// Mover peça
const movePiece = (move, position) => {
    position = {
        ...position
    };
    if ("remove" in move)
        delete position[move.remove];
    let piece = position[move.from];
    delete position[move.from];
    position[move.to] = piece;

    if ('promote' in move) {
        if (piece[0] == "w") piece = "wQ";
        else piece = "bQ";
        position[move.to] = piece;
    }
    return position;
}

// Obter todos os movimentos
const getAllMoves = (turn, position) => {
    let squarePieces = [];
    for (let square in position) {
        if (position[square][0] == turn[0])
            squarePieces.push(square);
    }
    let hasRemove = false;
    let moves = squarePieces.reduce((arr, s) => {
        getMovesRecur(s, position[s], position)
            .forEach(m => {
                arr.push(m);
                if ("remove" in m) hasRemove = true;
            });
        return arr;
    }, []);
    if (hasRemove)
        moves = moves.filter(m => "remove" in m);
    return moves;
}
