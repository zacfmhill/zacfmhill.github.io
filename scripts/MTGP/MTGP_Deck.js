import { MagicCard, MTGQuery } from './MTGP_MagicCard.js';

export class Deck {
    constructor(cardList = [], sideBoard = []) {
        this.cardList = cardList;
        this.sideboard = sideBoard;
    }

    async importFromString(importText) {
        const regexSideBoardSplit = /[sS]ideboard[\s]/g;
        const regex = /(\d+)\s([\D]+)/g;
        let match;

        let mainDeckText = importText;
        let sideboardSplit = regexSideBoardSplit.exec(importText);

        let sideBoardText = null;
        if (sideboardSplit !== null) {
            mainDeckText = importText.slice(0, sideboardSplit.index);
            sideBoardText = importText.slice(sideboardSplit.index + sideboardSplit[0].length, importText.length);
        }

        // Grab main deck cards: 
        while ((match = regex.exec(mainDeckText)) !== null) {
            let numberOfCards = parseInt(match[1].trim());
            let cardName = match[2].trim();
            console.log(`found RegEx: ${match}`);
            console.log(`Number of Cards: ${numberOfCards}\nCard Name: ${cardName}`);
            let cardData;
            try {
                cardData = await MTGQuery.search_card_fuzzyName(cardName);
                for (let i = 0; i < numberOfCards; i++) {
                    let tempCard = new MagicCard();
                    await tempCard.load_card_from_card_data(cardData);
                    this.cardList.push(tempCard);
                }

            }
            catch (e) {
                console.log("ERROR!");
                console.log(e);
            }
            // console.log(cardData);
        }
        console.log(this.cardList);

        // Grab sideboard deck cards: 
        if (sideBoardText !== null) {
            while ((match = regex.exec(sideBoardText)) !== null) {
                let numberOfCards = parseInt(match[1].trim());
                let cardName = match[2].trim();
                console.log(`Number of Cards: ${numberOfCards}\nCard Name: ${cardName}`);
                let cardData
                try {
                    cardData = await MTGQuery.search_card_fuzzyName(cardName);
                }
                catch (e) {
                    console.log("ERROR!");
                    console.log(e);
                }
                // console.log(cardData);
            }
        }

    }
}
