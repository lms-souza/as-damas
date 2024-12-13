// Variáveis Globais e Elementos DOM
let pilihanGame, levelHitam, levelPutih, allMovesNow, waktuMulaiGame, lamanyaPermainan;
const pilihanGameForm = document.getElementById('pilihan-game');
const levelHitamForm = document.getElementById('level-hitam');
const levelPutihForm = document.getElementById('level-putih');
const tombolMulai = document.getElementById('tombol-mulai');
const tombolMenyerah = document.getElementById('tombol-menyerah');
const tombolhentikan = document.getElementById('tombol-hentikan');
const giliran = document.getElementById('giliran');
const pemenang = document.getElementById('pemenang');
const listHistory = document.getElementById('list-history');
const lamaBermain = document.querySelector('.lama-bermain');

// Variáveis para o Jogo
let turn, backMove, hasHighlight, squareHighlighted, history, positionNow, twoComputer, jumlahNode, timeOut;
const tagBoard = "board";
const turnComputer = "black";
const initialPosition = '1p1p1p1p/p1p1p1p1/1p1p1p1p/8/8/P1P1P1P1/1P1P1P1P/P1P1P1P1';

// Função para verificar se o botão de iniciar deve estar habilitado
const checkTombolMulai = () => {
    tombolMulai.disabled = !(
        (pilihanGame === "lawan" && levelHitam) ||
        (pilihanGame === "komputer" && levelHitam && levelPutih)
    );
};

// Atualiza a exibição dos níveis com base na seleção do tipo de jogo
pilihanGameForm.addEventListener('change', () => {
    pilihanGame = pilihanGameForm.value;
    levelHitamForm.classList.toggle('d-none', pilihanGame !== 'lawan' && pilihanGame !== 'komputer');
    levelPutihForm.classList.toggle('d-none', pilihanGame !== 'komputer');
    checkTombolMulai();
});

// Atualiza o nível da IA das peças pretas
levelHitamForm.addEventListener('change', () => {
    levelHitam = parseInt(levelHitamForm.value);
    checkTombolMulai();
});

// Atualiza o nível da IA das peças brancas
levelPutihForm.addEventListener('change', () => {
    levelPutih = parseInt(levelPutihForm.value);
    checkTombolMulai();
});

// Função para baixar o histórico do jogo em um arquivo JSON
const downloadHistory = () => {
    const a = document.createElement("a");
    const file = new Blob([JSON.stringify(history)], { type: 'application/json' });
    a.href = URL.createObjectURL(file);
    a.download = "history.json";
    a.click();
};

// Interrompe o jogo atual
const hentikanGame = (adaPemenang = false) => {
    tombolMenyerah.classList.add('d-none');
    tombolhentikan.classList.add('d-none');
    turn = null;
    tombolMulai.disabled = false;

    Swal.fire(
        adaPemenang ? 'Jogo terminado' : 'Jogo interrompido'
    );

    lamanyaPermainan = new Date().getTime() - waktuMulaiGame;
    lamaBermain.textContent = `(Jogo durou ${(lamanyaPermainan / 1000).toFixed(1)} segundos)`;

    pilihanGameForm.disabled = false;
    levelHitamForm.disabled = false;
    levelPutihForm.disabled = false;
    clearTimeout(timeOut);
};

// Ação ao clicar em "Desistir"
tombolMenyerah.addEventListener('click', () => {
    Swal.fire({
        title: 'Você tem certeza que quer desistir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Tenho certeza :(',
        cancelButtonText: 'Não!'
    }).then((result) => {
        if (result.isConfirmed) {
            hentikanGame();
            pemenang.innerHTML = `Peças Negras (IA Nível ${levelHitam})`;
        }
    });
});

// Ação ao clicar em "Interromper"
tombolhentikan.addEventListener('click', () => {
    Swal.fire({
        title: 'Você tem certeza que quer interromper o jogo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Tenho certeza',
        cancelButtonText: 'Não!'
    }).then((result) => {
        if (result.isConfirmed) {
            hentikanGame();
        }
    });
});

// Verifica se uma jogada é válida e atualiza o estado do jogo
const onDrop = (source, target, piece, newPos, oldPos, orientation) => {
    if (Chessboard.objToFen(newPos) !== Chessboard.objToFen(oldPos)) {
        const moves = [...allMovesNow];
        if (!isValidMove(source, target, moves)) return 'snapback';

        const move = moves.find(m => m.to === target && m.from === source);
        positionNow = movePiece(move, oldPos);
        board.position(positionNow, false);
        history.push(move);

        removeGreySquares();
        if (move['remove']) {
            if (!hasAnotherEat(target, piece)) {
                changeTurn();
            } else {
                allMovesNow = getAllMoves(turn, positionNow).filter(m => m.from === target);
            }
        } else {
            changeTurn();
        }

        listHistory.innerHTML = `<li class="list-group-item">Peças Brancas: ${move.from} para ${move.to}` + listHistory.innerHTML;
        return 'trash';
    }
};

// Verifica se a peça pode ser movida
const onDragStart = (source, piece, position, orientation) => canMove(piece);

// Exibe as casas para onde a peça pode se mover
const onMouseoverSquare = (square, piece) => {
    if (piece && canMove(piece)) {
        const moves = allMovesNow.filter(m => m.from === square);
        if (moves.length > 0) {
            greySquare(square);
            moves.forEach(m => greySquare(m.to));
        }
    }
};

// Remove a indicação das casas destacadas
const onMouseoutSquare = () => {
    removeGreySquares();
};

// Exibe uma mensagem de movimento inválido
const onSnapbackEnd = () => {
    Swal.fire('Movimento inválido');
};

// Altera o turno e atualiza as opções de jogada
const changeTurn = () => {
    turn = turn === "white" ? "black" : "white";
    giliran.textContent = turn === "white" ? "Peças Brancas" : "Peças Negras";
    allMovesNow = getAllMoves(turn, positionNow);

    removeHighlightSquare();
    allMovesNow.forEach(m => {
        if ("remove" in m) highlightSquare(m.from);
    });

    if (allMovesNow.length === 0) {
        pemenang.textContent = turn === "white" ? "Peças Negras" : "Peças Brancas";
        hentikanGame(true);
    } else if (turn === turnComputer || twoComputer) {
        timeOut = window.setTimeout(playComputer, 500);
    }
};

const playComputer = () => {
    // Inicializa a quantidade de nós avaliada como 0
    jumlahNode = 0;
    let move, value, lamaMikir;
    let perpindahan = "";
    const position = positionNow;
    const alpha = Number.NEGATIVE_INFINITY;
    const beta = Number.POSITIVE_INFINITY;

    // Marca o tempo inicial de pensamento da IA
    lamaMikir = new Date().getTime();
    if (turn == "white") {
        // Determina o movimento e o valor usando a função minmax para o jogador branco
        [move, value] = minmax(positionNow, levelPutih, alpha, beta, true, 0, turn, turn);
        perpindahan += '<li class="list-group-item">Peças Brancas: '
    } else {
        // Determina o movimento e o valor usando a função minmax para o jogador negro
        [move, value] = minmax(positionNow, levelHitam, alpha, beta, true, 0, turn, turn);
        perpindahan +=
            '<li class="list-group-item list-group-item-dark">Peças Negras: '
    }
    // Calcula o tempo de pensamento da IA
    lamaMikir = (new Date().getTime()) - lamaMikir;

    // Copia o objeto de posição atual
    let newPos = {
        ...position
    };

    // Adiciona propriedades ao movimento
    move['jumlahNode'] = jumlahNode;
    move['waktu'] = lamaMikir;

    while ("nextEat" in move) {
        let nextEat = move["nextEat"];
        perpindahan += `${move.from} para ${move.to} || `;
        delete move.nextEat;
        newPos = movePiece(move, newPos);
        board.position(newPos);
        history.push(move);
        move = nextEat;
    }

    perpindahan += `${move.from} para ${move.to} `;
    newPos = movePiece(move, newPos);
    positionNow = newPos;
    board.position(newPos);
    history.push(move);

    perpindahan += `(${jumlahNode} Nós Avaliados ${lamaMikir / 1000} segundos)</li>`;
    listHistory.innerHTML = perpindahan + listHistory.innerHTML;

    if (jumlahNode > 600000) {
        levelHitam -= 2;
        levelPutih -= 2;
        Swal.fire(
            'Nível da IA Reduzido'
        )
    }
    changeTurn();
}

// Configuração do Jogo
const config = {
    position: initialPosition, // Posição inicial do tabuleiro
    draggable: true, // Habilita arrastar as peças
    onDragStart: onDragStart, // Função chamada ao começar a arrastar uma peça
    onDrop: onDrop, // Função chamada ao soltar uma peça
    onMouseoverSquare: onMouseoverSquare, // Função chamada ao passar o mouse sobre uma casa
    onMouseoutSquare: onMouseoutSquare, // Função chamada ao tirar o mouse de uma casa
    onSnapbackEnd: onSnapbackEnd // Função chamada ao finalizar um movimento inválido
}

// Inicializa o tabuleiro com a configuração especificada
const board = Chessboard(tagBoard, config);
positionNow = board.position();

tombolMulai.addEventListener('click', () => {
    giliran.textContent = "Peças Brancas";
    tombolMulai.disabled = true;
    if (pilihanGame == "lawan") {
        tombolMenyerah.classList.remove('d-none');
        twoComputer = false;
    } else if (pilihanGame == "komputer") {
        twoComputer = true;
        tombolhentikan.classList.remove('d-none');
    }
    listHistory.innerHTML = "";
    pemenang.innerHTML = "-";

    // Configuração do Jogo
    turn = "white"; // Define a vez para o jogador branco
    history = []; // Reseta o histórico de movimentos
    backMove = false; // Inicializa o estado de movimento de volta
    hasHighlight = false; // Inicializa o estado de destaque
    squareHighlighted = null; // Inicializa a casa destacada como nula
    board.position(initialPosition); // Define a posição inicial no tabuleiro
    positionNow = board.position();
    allMovesNow = getAllMoves(turn, positionNow);

    pilihanGameForm.disabled = true; // Desabilita o formulário de escolha do jogo
    levelHitamForm.disabled = true; // Desabilita o formulário de nível da IA negra
    levelPutihForm.disabled = true; // Desabilita o formulário de nível da IA branca

    lamaBermain.textContent = ""; // Limpa o tempo de jogo exibido
    waktuMulaiGame = new Date().getTime(); // Marca o tempo inicial do jogo

    if (twoComputer)
        timeOut = window.setTimeout(playComputer, 500); // Inicia o jogo entre dois computadores após meio segundo
});
