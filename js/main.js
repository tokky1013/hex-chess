let game;

class Game {
    constructor() {
        // カスタムプロパティを取得
        this.cellSize = $(':root').css('--cell-size').replace('px', '') - 0;
        this.chessmanSize = $(':root').css('--chessman-size').replace('px', '') - 0;
        this.borderWidth = $(':root').css('--border-width').replace('px', '') - 0;
        this.fieldSize = {};
        this.origin = {};
        this.turn = 0;
        this.playerNum = 0;

        this.playerNames = ['Red', 'Blue'];

        this.init();
    }

    init() {
        this.createField();
        $('#turn').css('color', 'var(--color-player0)');
        $('#turn').text(this.playerNames[0]);
        this.turn = 0;
        this.playerNum = 0;

        $('.cell').off();
    }

    start() {
        this.nextTurn();
    }

    nextTurn() {
        // その方向に一個進んだ先のindexを取得する関数を配列に格納
        const funcsGetNextIndex = [
            // 右
            (prevX, prevY) => { return { x: prevX + 1, y: prevY }; },
            // 左
            (prevX, prevY) => { return { x: prevX - 1, y: prevY }; },
            // 右上
            (prevX, prevY) => { return { x: (prevY % 2 === 0) ? prevX : prevX - 1, y: prevY - 1 }; },
            // 左上
            (prevX, prevY) => { return { x: (prevY % 2 === 0) ? prevX + 1 : prevX, y: prevY - 1 }; },
            // 右下
            (prevX, prevY) => { return { x: (prevY % 2 === 0) ? prevX : prevX - 1, y: prevY + 1 }; },
            // 左下
            (prevX, prevY) => { return { x: (prevY % 2 === 0) ? prevX + 1 : prevX, y: prevY + 1 }; },
        ];
        // 動かすコマが選択された時の処理
        const moveChessman = ($selectedCell) => {
            $(`.cell.available`).removeClass('candidate');
            $(`.cell:has(.chessman${this.playerNum})`).removeClass('selected');
            $selectedCell.addClass('selected');

            let index = this.getCellIndex($selectedCell);
            let nextCell;

            // 候補を調べてクラスとイベントを追加
            for (const func of funcsGetNextIndex) {
                let prevX = index.x;
                let prevY = index.y;

                let nextIndex = func(prevX, prevY);

                nextCell = this.getCell(nextIndex.x, nextIndex.y);
                if (this.isAvailable(nextCell) && this.getChessmanName(nextCell) === null) {
                    prevX = nextIndex.x;
                    prevY = nextIndex.y;
                    nextIndex = func(prevX, prevY);
                    nextCell = this.getCell(nextIndex.x, nextIndex.y);

                    while (this.isAvailable(nextCell) && this.getChessmanName(nextCell) === null) {
                        prevX = nextIndex.x;
                        prevY = nextIndex.y;
                        nextIndex = func(prevX, prevY);
                        nextCell = this.getCell(nextIndex.x, nextIndex.y);
                        if (!nextCell) break;
                    }

                    const $candidate = this.getCell(prevX, prevY);
                    $candidate.addClass('candidate');   // 候補を表示
                    // クリック時にコマを移動
                    const move = () => {
                        this.moveChessman(index, { x: prevX, y: prevY }, () => {
                            // 勝敗の判定
                            if (false) {

                            } else {
                                // 勝敗が決まっていなければ
                                $('.cell.selected').removeClass('selected');
                                $('.cell.candidate').removeClass('candidate');
                                $('.cell').off();
                                $('.cell.available:not(*:has(.chessman))').on('touchend', function (event) {
                                    moveCell($(this));
                                });
                            }
                        });
                    };
                    $candidate.on('touchend', move);
                }
            }

        };
        // 動かすセルが選択された時の処理
        const moveCell = ($selectedCell) => {
            // そのセルにコマがあればreturn
            if (this.getChessmanName($selectedCell) !== null) return;

            // 隣にavailableでないセルがなければreturn
            const index = this.getCellIndex($selectedCell);
            let hasUnavailableNeighbour = false;
            for (const func of funcsGetNextIndex) {
                const neighbourIndex = func(index.x, index.y);
                const neighbour = this.getCell(neighbourIndex.x, neighbourIndex.y);
                if (!this.isAvailable(neighbour)) {
                    hasUnavailableNeighbour = true;
                    break;
                }
            }
            if (!hasUnavailableNeighbour) return;

            $(`.cell.available`).removeClass('candidate');
            $('.cell.available').removeClass('selected');
            $selectedCell.addClass('selected');

            const markCandidate = ($cell) => {
                const cellIndex = this.getCellIndex($cell);
                for (const func of funcsGetNextIndex) {
                    const nextCellIndex = func(cellIndex.x, cellIndex.y);
                    const $nextCell = this.getCell(nextCellIndex.x, nextCellIndex.y);
                    if (!this.isAvailable($nextCell)) {
                        $nextCell.addClass('candidate');
                        $nextCell.off();    // 2回実行されないようにイベントを削除
                        const move = () => {
                            $('.cell.selected').removeClass('selected');
                            this.moveCell(index, nextCellIndex, () => {
                                // 端っこギリギリの時に拡張する
                                if (nextCellIndex.x === 0) {
                                    this.addColumnLeft();
                                } else if (nextCellIndex.x === this.fieldSize.width - 1) {
                                    this.addColumnRight();
                                }
                                if (nextCellIndex.y <= 1) {
                                    this.addRowTop();
                                } else if (nextCellIndex.y === this.fieldSize.height - 1) {
                                    this.addRowBottom();
                                }
                                this.endTurn();
                                this.nextTurn();
                            });
                        };
                        $nextCell.on('touchend', function (event) {
                            // 移動さきのセルを選択した時の処理
                            move();
                        });
                    }
                }
            };
            $('.cell.available').each(function () {
                markCandidate($(this));
            });
        }

        $(`.cell:has(.chessman${this.playerNum})`).on('touchend', function (event) {
            moveChessman($(this));
        });
    }

    endTurn() {
        // リセット
        $('.cell.selected').removeClass('selected');
        $('.cell.candidate').removeClass('candidate');
        $('.cell').off();

        this.turn++;
        this.playerNum = this.turn % 2;
        $('#turn').css('color', `var(--color-player${this.playerNum})`);
        $('#turn').text(this.playerNames[this.playerNum]);
    }

    // ----描画----
    adjustFieldWidth() {
        const width = (this.cellSize + this.borderWidth * 2) * 1.118 * (this.fieldSize.width + 0.5);
        $('.row').css('width', width + 'px');
    }

    createField() {
        const $main = $('main');
        const $field = $('#field');

        const rectMain = $main[0].getBoundingClientRect();
        const fieldWidth = rectMain.width;
        const fieldHeight = rectMain.height;

        const gap = (this.cellSize + this.borderWidth * 2) * 0.118;

        this.fieldSize.width = Math.ceil(fieldWidth / (this.cellSize + gap + this.borderWidth * 2) + 1 / 2);
        this.fieldSize.height = Math.ceil(fieldHeight / (this.cellSize + this.borderWidth * 2));

        $field.html('');

        for (let i = 0; i < this.fieldSize.height; i++) {
            const $row = $('<div>').addClass('row');

            for (let j = 0; j < this.fieldSize.width; j++) {
                $row.append($('<div>').addClass('cell'));
            }
            $field.append($row);
        }

        this.origin.y = Math.floor(this.fieldSize.height / 2);
        if (this.origin.y % 2 === 0) {
            this.origin.x = Math.floor(fieldWidth / 2 / (this.cellSize + gap + this.borderWidth * 2));
        } else {
            this.origin.x = Math.floor((fieldWidth / 2 + this.cellSize + this.borderWidth * 2) / (this.cellSize + gap + this.borderWidth * 2));
        }

        this.adjustFieldWidth();

        // セルの配置
        for (let i = -1; i <= 1; i++) {
            this.getCell(this.origin.x + i, this.origin.y - 2).addClass('available');
            this.getCell(this.origin.x + i, this.origin.y + 2).addClass('available');
        }
        if (this.origin.y % 2 === 0) {
            for (let i = -1; i <= 2; i++) {
                this.getCell(this.origin.x + i, this.origin.y - 1).addClass('available');
                this.getCell(this.origin.x + i, this.origin.y + 1).addClass('available');
            }
        } else {
            for (let i = -2; i <= 1; i++) {
                this.getCell(this.origin.x + i, this.origin.y - 1).addClass('available');
                this.getCell(this.origin.x + i, this.origin.y + 1).addClass('available');
            }
        }
        for (let i = -2; i <= 2; i++) {
            this.getCell(this.origin.x + i, this.origin.y).addClass('available');
        }

        // こまの配置
        this.getCell(this.origin.x - 1, this.origin.y - 2).append($('<div>').addClass('chessman chessman0'));
        this.getCell(this.origin.x - 1, this.origin.y + 2).append($('<div>').addClass('chessman chessman0'));
        this.getCell(this.origin.x + 1, this.origin.y - 2).append($('<div>').addClass('chessman chessman1'));
        this.getCell(this.origin.x + 1, this.origin.y + 2).append($('<div>').addClass('chessman chessman1'));
        this.getCell(this.origin.x - 2, this.origin.y).append($('<div>').addClass('chessman chessman1'));
        this.getCell(this.origin.x + 2, this.origin.y).append($('<div>').addClass('chessman chessman0'));

        // 移動中のセルを追加
        $field.append($('<div>').addClass('cell available moving d-none'));
    }

    addColumnLeft() {
        $('.row').each(function () {
            $(this).prepend($('<div>').addClass('cell'));
        });
        this.fieldSize.width++;
        this.adjustFieldWidth();
    }

    addColumnRight() {
        $('.row').each(function () {
            $(this).append($('<div>').addClass('cell'));
        });
        this.fieldSize.width++;
        this.adjustFieldWidth();
    }
    addRowTop() {
        let $row = $('<div>').addClass('row');
        for (let i = 0; i < this.fieldSize.width; i++) {
            $row.append($('<div>').addClass('cell'));
        }
        $('#field').prepend($row);
        $row = $('<div>').addClass('row');
        for (let i = 0; i < this.fieldSize.width; i++) {
            $row.append($('<div>').addClass('cell'));
        }
        $('#field').prepend($row);
        this.fieldSize.height++;
    }
    addRowBottom() {
        const $row = $('<div>').addClass('row');
        for (let i = 0; i < this.fieldSize.width; i++) {
            $row.append($('<div>').addClass('cell'));
        }
        $('#field').append($row);
        $('#field').append($('.cell.moving'));

        this.fieldSize.height++;
    }

    // ----こま、セルの移動----
    moveCell(from, to, f=null) {
        const $movingCell = $('.cell.moving');
        const cellPosFrom = this.getCellPos(from.x, from.y);
        const cellPosTo = this.getCellPos(to.x, to.y);

        // 移動前の処理
        $movingCell.css({
            'top': cellPosFrom.top + 'px',
            'left': cellPosFrom.left + 'px'
        });
        $movingCell.removeClass('d-none');
        this.getCell(from.x, from.y).removeClass('available');

        setTimeout(() => {
            // 移動させる
            $movingCell.css({
                'top': cellPosTo.top + 'px',
                'left': cellPosTo.left + 'px'
            });
            setTimeout(() => {
                // 移動後の処理
                this.getCell(to.x, to.y).addClass('available');
                $movingCell.addClass('d-none');
                if (f !== null) {
                    f();
                }
            }, 300);
        }, 100);
    }

    moveChessman(from, to, f = null) {
        const $cellFrom = this.getCell(from.x, from.y);
        const $cellTo = this.getCell(to.x, to.y);
        if (this.getChessmanName($cellFrom) && !this.getChessmanName($cellTo) && this.isAvailable($cellTo)) {
            let $chessman = $cellFrom.find('.chessman')[0];

            const cellPosFrom = this.getCellPos(from.x, from.y);
            const cellPosTo = this.getCellPos(to.x, to.y);
            const gap = (this.cellSize + this.borderWidth * 2) * 0.118;

            let chessmanPosFrom = {
                top: cellPosFrom.top + (this.cellSize - this.chessmanSize) / 2 + this.borderWidth,
                left: cellPosFrom.left + (this.cellSize - this.chessmanSize) / 2 + this.borderWidth + gap,
            };
            let chessmanPosTo = {
                top: cellPosTo.top + (this.cellSize - this.chessmanSize) / 2 + this.borderWidth,
                left: cellPosTo.left + (this.cellSize - this.chessmanSize) / 2 + this.borderWidth + gap,
            };

            // 移動前の処理
            $('#field').append($chessman);
            $chessman = $('#field > .chessman');
            $chessman.addClass('moving');
            $chessman.css({
                'top': chessmanPosFrom.top + 'px',
                'left': chessmanPosFrom.left + 'px'
            });

            setTimeout(() => {
                // 移動させる
                $chessman.css({
                    'top': chessmanPosTo.top + 'px',
                    'left': chessmanPosTo.left + 'px'
                });
                setTimeout(() => {
                    // 移動後の処理
                    $chessman.removeClass('moving');
                    $cellTo.append($chessman);
                    if (f !== null) {
                        f();
                    }
                }, 300);
            }, 100);

            return true;
        }
        return false;
    }


    // ----その他----
    getCell(x, y) {
        return $(`.row:nth-child(${y + 1}) .cell:nth-child(${x + 1})`);
    }

    getCellPos(x, y) {
        let rowPos = $(`.row:nth-child(${y + 1})`).position();
        let cellPos = this.getCell(x, y).position();

        return {
            top: rowPos.top + cellPos.top,
            left: rowPos.left + cellPos.left
        };
    }

    getCellIndex(cell) {
        let index = {};
        index.x = cell.index();
        index.y = cell.parent().index();

        return index;
    }

    // 指定したセルにchessman0, chessman1のどちらがあるかを返す
    // どちらもなければnullを返す
    getChessmanName(cell) {
        const $chessman = cell.find(".chessman");
        if ($chessman.length === 0) {
            return null;
        }
        let classes = $chessman.first().attr('class').split(' ');
        for (const className of classes) {
            if (className.match(/^chessman[0,1]$/)) {
                return className;
            }
        }
        return null;
    }
    isAvailable(cell) {
        return cell.hasClass('available');
    }
}

// ----初期化----
$(function () {
    // プル・トゥ・リフレッシュを禁止
    let startY = 0;

    $(window).on("touchstart", function (e) {
        startY = e.originalEvent.touches[0].pageY;
    });

    $(window).on("touchmove", function (e) {
        let scrollTop = $(window).scrollTop();
        let currentY = e.originalEvent.touches[0].pageY;

        // ページ先頭で下方向に引っ張った場合のみ無効化
        if (scrollTop <= 0 && currentY > startY) {
            e.preventDefault(); // プル・トゥ・リフレッシュを禁止
        }
    });

    // ----ゲームをスタート----
    game = new Game();
    game.init();
    game.start();
});