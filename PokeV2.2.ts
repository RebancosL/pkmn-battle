//npm install express typescript ts-node @types/node @types/express --save-dev

const express = require('express');
const app = express();

interface Pokemon {
  id: number;
  name: string;
  image: string;
  moves: string[];
  attack: string;
  power: number;
  hp: number;
  sound: string;
}

let box: Pokemon[] = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(8080, () => console.log('Listening on port 8080.'));

app.get('/', (req, res) => {
  res.send(`
    <h1>Pokémon API</h1>
    <ul>
      <li><a href="/store">Store</a></li>
      <li><a href="/box">Box</a></li>
      <li><a href="/viewPokemon">View Pokémon</a></li>
      <li><a href="/battle">POKEMON BATTLE</a></li>

    </ul>
  `);
});

//html output to input pokemon choice
app.get('/store', (req, res) => {
  res.send(`
    <h1>Store Pokémon</h1>
    <form method="get" action="/store/pokemon">
      <input type="text" name="pokemonName" placeholder="Enter Pokémon name">
      <button type="submit">Store</button>
    </form>
    <a href="/">Return to Menu</a>

  `);
  req.query.toLowerCase
});

//limit requirement 
app.get('/store/pokemon', async (req, res) => {
  if (box.length >= 1000) {
    res.status(400).send('Error: Box is full. Cannot store more Pokémon.');
    return;
  }

  const { pokemonName } = req.query;
  try {// store image and convert to base64 
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${(pokemonName as string).toLowerCase()}`);
    const pokemonData = await response.json();
    const pokemonImageResponse = await fetch(pokemonData.sprites.front_default);
    const imageData = await pokemonImageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageData).toString('base64');
    //store sound data pokeapi -> base 64 -> wav 
    const soundResponse = await fetch(pokemonData.cries.latest);
    const soundData = await soundResponse.arrayBuffer();
    const soundBase64 = Buffer.from(soundData).toString('base64');
    const pokemon: Pokemon = {
      id: pokemonData.id,
      name: pokemonData.name,
      image: imageBase64,
      moves: [],
      attack: pokemonData.moves[0].move.name,
      power:pokemonData.stats[1].base_stat,
      hp:pokemonData.stats[0].base_stat,
      sound: `data:audio/wav;base64,${soundBase64}`,
    };
    for (let i = 0; i < pokemonData.moves.length; i++) {
      pokemon.moves.push(pokemonData.moves[i].move.name);
    }
//lalagay sa box 
    box.push(pokemon);
    res.json(pokemon);
  } catch (error) {
    res.status(400).send(`Error storing pokemon: ${error.message}`);
  }
});

//pakita json sa box
app.get('/box', (req, res) => {
  res.json(box);
});


//input ng view
app.get('/viewPokemon', (req, res) => { // html output on localhost:8080/viewPokemon
  res.send(`
    <h1>View Pokémon</h1>
    <form method="get" action="/viewPokemon/result">
      <input type="text" name="pokemonName" placeholder="Enter Pokémon name">
      <button type="submit">View</button>
    </form>
     <a href="/">Return to Menu</a>
  `);
});

// json file nung pokemon
app.get('/viewPokemon/result', (req, res) => {
  const { pokemonName } = req.query;
  const foundPokemon = box.find((pkmn) => pkmn.name === pokemonName);
  console.log(foundPokemon)
  if (!foundPokemon) {
    res.status(400).send(`Error: Pokémon not found in box`);
  } else { // Html output to show pokemon 
    res.send(` 
      <h1>View Pokémon</h1>
      <p>Name: ${foundPokemon.name}</p>
      <p>Image: <img src="data:image/png;base64,${foundPokemon.image}" /></p>
      <p>Base64 Image: ${foundPokemon.image}</p>
      <p>Moves: ${foundPokemon.moves.join(', ')}</p>
      <p>Sound: ${foundPokemon.name}.wav</p>
      <p><audio controls>
        <source src="${foundPokemon.sound}" type="audio/wav">
        Your browser does not support the audio element.
      </audio></p>
    `);
  }
});


//Pokemon battle picker
app.get('/battle', (req, res) => {
      res.send(` 
        <h1>Pick 2 Pokemon </h1>
        <form action="/battle/Result">
        <label for="firstP">Pokemon 1:</label>
        <input type="text" id="firstP" name="firstP"><br><br>
        <label for="secondP">Pokemon 2:</label>
        <input type="text" id="secondP" name="secondP"><br><br>
        <input type="submit" value="Submit">
        </form>
        <a href="/">Add more pokemon</a>
        

        
      `);
    }
  );

// battle simulation
app.get('/battle/Result', (req, res) => {
    const { firstP, secondP } = req.query;
  
    // Case Sensitive
    const pkmn1 = box.find(pkmn => pkmn.name.toLowerCase() === (firstP as string).toLowerCase());
    const pkmn2 = box.find(pkmn => pkmn.name.toLowerCase() === (secondP as string).toLowerCase());
  
    // Checker kung valid
    if (!pkmn1 || !pkmn2) {
      return res.status(400).send('Error: One or both Pokémon not found in the box.');
    }
  
    // Battle Logic
    let battleResult;
    let attack1 : number = pkmn1.hp - pkmn2.power
    let attack2 : number = pkmn2.hp - pkmn1.power
    attack1 = Math.max(attack1,0);
    attack2 = Math.max(attack2,0);
    
    if (attack1 > attack2 ) {
      battleResult = `${pkmn1.name.toUpperCase()} wins!`;
    } else if (attack1 < attack2)  {
      battleResult = `${pkmn2.name.toUpperCase()} wins!`;
    } else if (attack1 || attack2 <= 0){
      battleResult= "DRAW";      
    } else {
      battleResult = "Uknown!";
    }
  
    //Battle Output
    res.send(`
      <h1><pre> 
                            ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
                            ▒                                    ▒
                            ▒      Pokémon Battle Simulator      ▒
                            ▒                                    ▒
                            ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
      </pre></h1>
  
      <h1><pre>                                     ${pkmn1.name.toUpperCase()} VS ${pkmn2.name.toUpperCase()}          </pre></h1>

      <p><img src="data:image/png;base64,${pkmn1.image}" alt="${pkmn1.name}" /></p>
      <h3>${pkmn1.name.toUpperCase()} HP: ${pkmn1.hp} </h3>
      <p5>Attack: ${pkmn1.attack.toUpperCase()} Damage: ${pkmn1.power}</p5>
      <p><img src="data:image/png;base64,${pkmn2.image}" alt="${pkmn2.name}" /></p>
      <h3>${pkmn2.name.toUpperCase()} HP: ${pkmn2.hp}</h3>
      <p5>Attack: ${pkmn2.attack.toUpperCase()} Damage: ${pkmn2.power}</p5>
      <h2>${battleResult}</h2> 
      <h4><pre><a href="/battle">Back to Battle</a>         <a href="/box2">Add more pokemon</a>          <a href="/box2">JSON Battle Output</a></pre></h4>
    `);
  
  
    const box2 = [{}];

    box2.pop();
    app.get('/box2', (req, res) => {
      res.json(box2);
    });

    box2.push({
      "pkm1": {
          "name": pkmn1.name,
          "hp": pkmn1.hp,
          "attack": pkmn1.power
      },
      "pkm2": {
          "name": pkmn2.name,
          "hp": pkmn2.hp,
          "attack": pkmn2.power
      },
      "results": battleResult
  });
});












































app.get('/battle/Result', (req, res) => {
    const { firstP, secondP } = req.query;
  
    // Case Sensitive
    const pkmn1 = box.find(pkmn => pkmn.name.toLowerCase() === (firstP as string).toLowerCase());
    const pkmn2 = box.find(pkmn => pkmn.name.toLowerCase() === (secondP as string).toLowerCase());
  
    // Checker kung valid
    if (!pkmn1 || !pkmn2) {
      return res.status(400).send('Error: One or both Pokémon not found in the box.');
    }
  
    // Battle Logic
    let battleResult;
    let attack1 : number = pkmn1.hp - pkmn2.power
    let attack2 : number = pkmn2.hp - pkmn1.power
    
    if (attack1 > attack2 ) {
      battleResult = `${pkmn1.name.toUpperCase()} wins!`;
    } else if (attack2 > attack1)  {
      battleResult = `${pkmn2.name.toUpperCase()} wins!`;
    } else if (attack1 && attack2 <= 0){
      battleResult= "DRAW";      
    } else {
      battleResult = "Uknown!";
    }
  
    //Battle Output
    res.send(`
      <h1><pre> 
                            ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
                            ▒                                    ▒
                            ▒      Pokémon Battle Simulator      ▒
                            ▒                                    ▒
                            ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
      </pre></h1>
  
<h1><pre>                                     ${pkmn1.name.toUpperCase()} VS ${pkmn2.name.toUpperCase()}          </pre></h1>

      <p><img src="data:image/png;base64,${pkmn1.image}" alt="${pkmn1.name}" /></p>
      <h3>${pkmn1.name.toUpperCase()} HP: ${pkmn1.hp} </h3>
      <p5>Attack: ${pkmn1.attack.toUpperCase()} Damage: ${pkmn1.power}</p5>
      <p><img src="data:image/png;base64,${pkmn2.image}" alt="${pkmn2.name}" /></p>
      <h3>${pkmn2.name.toUpperCase()} HP: ${pkmn2.hp}</h3>
      <p5>Attack: ${pkmn2.attack.toUpperCase()} Damage: ${pkmn2.power}</p5>
      <h2>${battleResult}</h2> 
      <a href="/battle">Back to Battle</a>
    `);
  });