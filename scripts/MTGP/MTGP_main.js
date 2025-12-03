import { MTGQuery, MagicCard } from './MTGP_MagicCard.js';
import { Board } from './MTGP_Board.js';
import { Deck } from './MTGP_Deck.js'

window.onload = async () => {

    const card1 = new MagicCard("026e7167-d665-43d0-a51e-8df2d68cdb5e");
    await card1.load_card();
    console.log(card1.id);
    console.log(card1.get_data());

    //Test Query
    console.log(await MTGQuery.search_card('Jace'));
    console.log(await MTGQuery.search_set('mmq'));

    const board = new Board('displayCanvas');
    console.log(board);
    var d = new Deck();
    await d.importFromString(`2 Cecil, Dark Knight
4 Deep-Cavern Bat
4 Enduring Curiosity
4 Floodpits Drowner
2 Preacher of the Schism
4 Spyglass Siren
1 Tishana's Tidebinder
2 Bitter Triumph
1 Faebloom Trick
2 Phantom Interference
2 Shoot the Sheriff
2 Stab
1 Tragic Trajectory
4 Kaito, Bane of Nightmares
4 Gloomlake Verge
5 Swamp
2 Multiversal Passage
3 Restless Reef
2 Soulstone Sanctuary
5 Island
4 Watery Grave

Sideboard
2 Annul
2 Duress
1 Faebloom Trick
1 Soul-Guide Lantern
1 Lord Skitter, Sewer King
1 Preacher of the Schism
1 Qarsi Revenant
1 Stab
1 Tishana's Tidebinder
1 Zero Point Ballad
2 Spell Pierce
1 Villainous Wrath`);
    for (let c of d.cardList) {
        board.addCard(c, 'front', null);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    // board.addCard(card1, null);
}
