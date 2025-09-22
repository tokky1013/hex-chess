let game;

class Game {
    constructor() {
        // カスタムプロパティを取得
        this.cellSize = $(':root').css('--cell-size').replace('px', '') - 0;
        this.chessmanSize = $(':root').css('--chessman-size').replace('px', '') - 0;
        this.borderWidth = $(':root').css('--border-width').replace('px', '') - 0;
        this.fieldSize = {};
        this.origin = {};

        this.init();
    }

    init() {
        this.createField();
        $('#turn').css('color', 'var(--color-player0)')
    }

    start() {

    }

    // ----描画----
    adjustFieldWidth() {
        const width = (this.cellSize + this.borderWidth * 2) * 1.118 * this.fieldSize.width;
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

    }

    addColumnRight() {

    }

    // ----こま、セルの移動----
    moveCell(from, to) {
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
            }, 300);
        }, 100);
    }

    moveChessman(from, to) {
        const $cellFrom = this.getCell(from.x, from.y);
        const $cellTo = this.getCell(to.x, to.y);
        if (this.hasChessman($cellFrom) && !this.hasChessman($cellTo) && this.isAvailable($cellTo)) {
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

    hasChessman(cell) {
        return cell.find(".chessman").length > 0;
    }
    isAvailable(cell) {
        return cell.hasClass('available');
    }
}

// ----初期化----
$(function () {
    game = new Game();
    game.init();
    game.start();
});