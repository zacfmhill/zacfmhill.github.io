import { Rect } from './Rect.js';
import { Deck } from './MTGP_Deck.js';


const WIDTH = 'width';
const HEIGHT = 'height';


function draw_card_from_center_cords(ctx, card, posx, posy, width, location) {
    let topLeftX = posx - width / 2;
    let topLeftY = Math.floor(posy - ((88 / 63) * width) / 2);
    ctx.drawImage(card.image_element, topLeftX, topLeftY, width, (88 / 63) * width);
}

// Returns the number of pixels a percentage is of the total width/height [width]
function percentage_to_pixels(canvas, percentage, dim_selection) {
    const mult = dim_selection === 'width' ? canvas.width : canvas.height;
    return Math.floor((percentage / 100.0) * mult);
}

function newRectFromPercentages(canvas, x_percent, y_percent, width_percent, height_percent) {
    return new Rect(
        percentage_to_pixels(canvas, x_percent, WIDTH),
        percentage_to_pixels(canvas, y_percent, HEIGHT),
        percentage_to_pixels(canvas, width_percent, WIDTH),
        percentage_to_pixels(canvas, height_percent, HEIGHT)
    );
}

export class Board {
    #area_rects = [];
    #area_padding_percent = 0.5;
    #inner_area_padding_percent = 0.25;


    #card_W_to_H = (88.9 / 63.5);
    #canvas_W_to_H_percent = 0;     //! Defined based on canvas size. 

    #card_height_p = (50 - ((3 * this.#area_padding_percent) + (5 * this.#inner_area_padding_percent))) / 3;
    #card_width_p = 0;


    // Creature area height & width
    #info_area_xL_p = this.#area_padding_percent;
    #info_area_yL_p = this.#area_padding_percent;
    #info_area_width_p = 20;
    #info_area_height_p = 100 - 2 * this.#area_padding_percent;

    // Creature area 
    #creature_area_xL_p = this.#info_area_xL_p + this.#info_area_width_p + this.#area_padding_percent;
    #creature_area_yL_p = this.#info_area_yL_p;
    #creature_area_width_p = 0;         // ! Defined based on width of card. 
    #creature_area_height_p = 2 * this.#card_height_p + (3 * this.#inner_area_padding_percent);

    // Artifact Enchantment area 
    #artenc_area_xL_p = 0;              // ! Defined based on width of card. 
    #artenc_area_yL_p = this.#creature_area_yL_p;
    #artenc_area_width_p = 4 * this.#inner_area_padding_percent; // ! Defined based on width of card. 
    #artenc_area_height_p = this.#creature_area_height_p;

    // Land area 
    #land_area_xL_p = this.#creature_area_xL_p;
    #land_area_yL_p = this.#creature_area_yL_p + this.#creature_area_height_p + this.#area_padding_percent;
    #land_area_width_p = 0;  // ! Defined based on width of card. 
    #land_area_height_p = this.#card_height_p + (2 * this.#inner_area_padding_percent);

    // Deck area 
    #deck_area_xL_p = 0;  // ! Defined based on width of card. 
    #deck_area_yL_p = this.#creature_area_yL_p + this.#creature_area_height_p + this.#area_padding_percent;
    #deck_area_width_p = (2 * this.#inner_area_padding_percent);  // ! Defined based on width of card. 
    #deck_area_height_p = this.#card_height_p + (2 * this.#inner_area_padding_percent);

    // Graveyard area 
    #graveyard_area_xL_p = this.#creature_area_xL_p;
    #graveyard_area_yL_p = this.#creature_area_yL_p + this.#creature_area_height_p + this.#area_padding_percent;
    #graveyard_area_width_p = 0;  // ! Defined based on width of card. 
    #graveyard_area_height_p = this.#card_height_p + (2 * this.#inner_area_padding_percent);

    // Exile area 
    #exile_area_xL_p = this.#creature_area_xL_p;
    #exile_area_yL_p = this.#creature_area_yL_p + this.#creature_area_height_p + this.#area_padding_percent;
    #exile_area_width_p = 0;  // ! Defined based on width of card. 
    #exile_area_height_p = this.#card_height_p + (2 * this.#inner_area_padding_percent);


    // Ref CARD 
    #cpx = this.#creature_area_xL_p + this.#inner_area_padding_percent;
    #cpy = this.#creature_area_yL_p + this.#inner_area_padding_percent;



    constructor(canvasName) {

        // Setup of canvas and data containers 
        this.canvas = document.getElementById(canvasName);
        this.ctx = this.canvas.getContext('2d');
        this.output_data_container = document.getElementById('output-data-text');
        this.log_data_container = document.getElementById('log-data-text');

        // Settings for drawing colors and canvas dims. 
        this.table_color = "#0f0f0f"
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.board_center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        console.log(this.canvas.width);
        console.log(this.canvas.height);


        //! Dynamic update widths and heights based on canvas height/width:
        // set scalar for converting width percentage to height percentage for a card
        this.#canvas_W_to_H_percent = (this.canvas.width / this.canvas.height);
        // set card width based on height percentage and canvas: 
        this.#card_width_p = (1 / (this.#canvas_W_to_H_percent * (this.#card_W_to_H))) * this.#card_height_p;
        // set artifact width based on card width 
        this.#artenc_area_width_p += + 3 * this.#card_width_p;
        console.log(this.#artenc_area_width_p);
        // set creature width based on card width
        let temp_width_without_info = (100 - (4 * this.#area_padding_percent) - this.#info_area_width_p);
        this.num_cards_in_row = Math.floor((temp_width_without_info - 2 * this.#inner_area_padding_percent) / (this.#card_width_p + this.#inner_area_padding_percent)) - 3;
        this.#creature_area_width_p = this.num_cards_in_row * (this.#card_width_p + this.#inner_area_padding_percent) + this.#inner_area_padding_percent;
        // set land area width based on creature area width 
        this.#land_area_width_p = this.#creature_area_width_p;
        // set artifact left X position based on width of creatures row. 
        this.#artenc_area_xL_p = this.#creature_area_xL_p + this.#creature_area_width_p + this.#area_padding_percent;
        // set deck area left X position and width: 
        this.#deck_area_width_p += this.#card_width_p;
        this.#deck_area_xL_p = this.#artenc_area_xL_p;
        // set graveyard area left X position and width: 
        this.#graveyard_area_width_p += this.#card_width_p;
        this.#graveyard_area_xL_p = this.#deck_area_xL_p + this.#deck_area_width_p + this.#area_padding_percent;
        // set exile area left X position and width: 
        this.#exile_area_width_p += this.#card_width_p;
        this.#exile_area_xL_p = this.#graveyard_area_xL_p + this.#graveyard_area_width_p + this.#area_padding_percent;


        //* Create areas:
        // Card details info area
        this.info_area = newRectFromPercentages(this.canvas, this.#info_area_xL_p
            , this.#info_area_yL_p, this.#info_area_width_p, this.#info_area_height_p);
        this.#area_rects.push(this.info_area);
        // Creature area
        this.creature_area = newRectFromPercentages(this.canvas, this.#creature_area_xL_p
            , this.#creature_area_yL_p, this.#creature_area_width_p,
            this.#creature_area_height_p);
        this.#area_rects.push(this.creature_area);
        // Artifact and enchantment area: 
        this.art_enc_area = newRectFromPercentages(this.canvas, this.#artenc_area_xL_p,
            this.#artenc_area_yL_p, this.#artenc_area_width_p, this.#artenc_area_height_p);
        this.#area_rects.push(this.art_enc_area);
        // Land area: 
        this.land_area = newRectFromPercentages(this.canvas, this.#land_area_xL_p,
            this.#land_area_yL_p, this.#land_area_width_p, this.#land_area_height_p);
        this.#area_rects.push(this.land_area);

        // Deck area: 
        this.deck_area = newRectFromPercentages(this.canvas, this.#deck_area_xL_p,
            this.#deck_area_yL_p, this.#deck_area_width_p, this.#deck_area_height_p);
        this.#area_rects.push(this.deck_area);
        // Graveyard area: 
        this.graveyard_area = newRectFromPercentages(this.canvas, this.#graveyard_area_xL_p,
            this.#graveyard_area_yL_p, this.#graveyard_area_width_p, this.#graveyard_area_height_p);
        this.#area_rects.push(this.graveyard_area);
        // Exile area: 
        this.exile_area = newRectFromPercentages(this.canvas, this.#exile_area_xL_p,
            this.#exile_area_yL_p, this.#exile_area_width_p, this.#exile_area_height_p);
        this.#area_rects.push(this.exile_area);


        // this.cp = new Rect(
        //     percentage_to_pixels(this.canvas, this.#cpx, WIDTH),
        //     percentage_to_pixels(this.canvas, this.#cpy, HEIGHT),
        //     percentage_to_pixels(this.canvas, this.#cpxp, WIDTH),
        //     percentage_to_pixels(this.canvas, this.#cpxp, WIDTH) * this.#card_W_to_H
        // );


        // this.cp = newRectFromPercentages(this.canvas, this.#cpx
        //     , this.#cpy, this.#card_width_p,
        //     this.#card_height_p);
        // this.#area_rects.push(this.cp);

        // creature area. 
        for (let i = 0; i < this.num_cards_in_row; i++) {
            this.#area_rects.push(newRectFromPercentages(this.canvas, this.#cpx + i * this.#card_width_p + i * this.#inner_area_padding_percent
                , this.#cpy, this.#card_width_p,
                this.#card_height_p));
        }

        // art. area
        for (let i = 0; i < 3; i++) {
            this.#area_rects.push(newRectFromPercentages(this.canvas, this.#artenc_area_xL_p + this.#inner_area_padding_percent + i * this.#card_width_p + i * this.#inner_area_padding_percent
                , this.#artenc_area_yL_p + this.#inner_area_padding_percent, this.#card_width_p, this.#card_height_p));
        }


        this.drawBoardBase();
    }

    drawBoardBase() {
        this.ctx.save();

        // Draw base table. 
        this.ctx.fillStyle = this.table_color;
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fill();

        // Dividing Line. 
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#FFF';
        this.ctx.moveTo(0, this.board_center.y);
        this.ctx.lineTo(this.canvas.width, this.board_center.y);
        this.ctx.lineWidth = percentage_to_pixels(this.canvas, .1, 'height');
        this.ctx.stroke();

        // Draw  areas: 
        for (let A of this.#area_rects) {
            A.draw_rect(this.ctx);
        }

        this.ctx.restore();
    }

    async addCard(card, frontOrBack, location) {
        let side = card.image_element_front;
        if (frontOrBack == 'back') {
            side = card.image_element_back;
        }
        this.ctx.drawImage(card.image_element_front, 230, 10, 100, this.#card_W_to_H * 100);
        // draw_card_from_center_cords(this.ctx, card, 0, 0, 100, location)
    }
}



// TODO: Have the add function add a card to some database for the given location. 
/*
        Also checks the type of the card to make sure it's valid.
        Then if it already exists in the database, indicate with slightly offset card and number.
        If it doesn't exist, add it and move the added card to be in the next "column" posiiton.
        If reached max of columns, reduce scale of all cards and redraw.
*/

// TODO: Make a card tappable. 
/*
        Start with lands. Have function for tap(). When tapped, adds mana to Player object's mana pool.
        Add action to list of actions that have occured????
*/

// TODO: make UI for info screen on left to show a highlighted card's info and larger image. 

// TODO: Make state of game somehow which dictates phases and upkeeps??? 

// TODO: Create UI for a hand. 

// TODO: Deck Object
/*
        ? Same object used for graveyard and exile?
        *Be able to define a Deck object which has functions for:
            - Draw()
            - Mill()
            - import a deck from a file:
                - MTGA export paste in
                - MTGO txt file
                - apprentice/mws DEC file
            - Shuffle()
            - Scry/Adventure/....
*/

// TODO: Player Object
/*
        * Stores:
            - Deck object
            - Graveyard object (same object type as a deck?? )
            - Exile object (same object type as a deck?? )
            - Health info
            - Mana info

        * Has functions for:
            - modify hand -- add card, discard, etc.
            - add mana
            - change health
            - spending mana to play a card 
            - moving through phases?  <-- simply a function of the game?? 
*/

