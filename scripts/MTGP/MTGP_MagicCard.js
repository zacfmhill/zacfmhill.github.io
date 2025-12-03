
/**
 * Appends the given parameters to the given URL.
 * @param {URL} baseURL - The base url to append to.
 * @param {Object} params - The parameter object.
 * @returns {URL} The base url with items appended.
 */
function appendOptions(baseURL, params) {
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            baseURL.searchParams.append(key, value);
        }
    }
}

/**
 * Appends the given parameters to the given URL.
 * @param {String} url - The url to make a request to.
 * @param {Object} method - The method type. e.x POST
 * @param {JSON} body - The request body
 * @returns {json} the request response
 */
export async function callApiWithHeaders(url, method, body = null) {
    const headers = new Headers({
        'User-Agent': navigator.userAgent, // Customize  User-Agent string
        'Accept': 'application/json' // Specify the content types 
    });

    const options = {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : null
    };

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();


        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        // throw error;
    }
}


export class MagicCard {

    constructor(id = 0) {
        this.id = id;
        this.card_data = null;
        this.image_element_front = null;
        this.image_element_back = null;
    }

    // loads the image into a new Image Element
    async load_image() {
        /**
         * TODO: NEED TO UPDATE SO THAT IF THERES MULTIPLE SIDES IT WILL LOAD BOTH SIDES?? 
         */
        // If the image isnot missing
        if (this.card_data.image_status !== 'missing') {
            // If there is no card_faces option then the card is just 1 face. 
            if (this.card_data.card_faces == null) {
                this.image_element_front = new Image();
                this.image_element_front.src = this.get_image_urls().png;
            } else {
                this.image_element_front = new Image();
                this.image_element_back = new Image();
                this.image_element_front.src = this.card_data.card_faces[0].image_uris.png;
                this.image_element_back.src = this.card_data.card_faces[1].image_uris.png;
            }
        }
    }

    // Loads the card by calling the API with card's id
    async load_card() {
        await callApiWithHeaders(`https://api.scryfall.com/cards/${this.id}`, 'GET')
            .then(data => this.card_data = data);
        this.load_image();
    }

    async load_card_from_card_data(card) {
        this.card_data = card;
        this.id = card.id;
        await this.load_image();
    }


    // Getters
    get_id() { return this.id }
    get_data() { return this.card_data }
    get_name() { return this.card_data.name }
    get_image_urls() { return this.card_data.image_uris }
    get_color_identity() { return this.card_data.color_identity }
    get_keywords() { this.card_data.keywords }
    get_manacost() { this.card_data.mana_cost }



}

export class MTGQuery {

    static async search_card(name, search_options = {}) {
        const url = new URL('https://api.scryfall.com/cards/search');
        search_options.q = name;
        appendOptions(url, search_options)
        var data = callApiWithHeaders(url, 'GET');
        return data
    }
    static async search_set(name, search_options = {}) {
        const url = new URL(`https://api.scryfall.com/sets/${name}`);
        appendOptions(url, search_options)
        var data = callApiWithHeaders(url, 'GET');
        return data
    }
    static async search_card_fuzzyName(name, search_options = {}) {
        const url = new URL(`https://api.scryfall.com/cards/named?fuzzy=${name}`);
        appendOptions(url, search_options)
        var data = callApiWithHeaders(url, 'GET');
        return data
    }

}


