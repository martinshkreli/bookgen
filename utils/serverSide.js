export function getGenre() {
  let genresList = ['Action', 'Adventure', 'Alternative History', 'Apocalyptic', 'Children\'s', 'Comedy', 
    'Crime', 'Cyberpunk', 'Drama', 'Dystopian', 'Elizabethan', 'Existentialist', 'Fantasy', 'Gothic', 
    'Historical', 'Horror', 'Legal', 'LGBTQ', 'Magical Realism', 'Mystery', 'Near-future', 'Parable', 
    'Paranormal', 'Post-Apocalyptic', 'Romance', 'Postmodern', 'Science Fiction', 'Sports', 
    'Star Trek Fan Fiction', 'Steampunk', 'Superhero', 'Supernatural', 'Teenage', 'Thriller',
    'Tragedy', 'Utopian', 'Victorian', 'Western', 'Young Adult'];
  console.clear();
  let randomGenre = genresList[Math.floor(Math.random() * genresList.length)];
  console.log(`\x1b[35mGenre is: ${randomGenre}`);
  return randomGenre;
}

export async function outlineGenerator(state){
  let outlinePrompt =  `Generate the outline of an original ${state.desiredPages}-page ${state.plotGenre} fiction book. Imagine and then carefully label the following: a detailed plot, characters with names, settings and writing style. You have ${state.model.tokenLimit - (40 + state.padAmount)} words remaining to write the outline. It is CRITICAL you as many words as possible.`;

  //readline.cursorTo(process.stdout,2,2)
  //process.stdout.write(`\x1b[36mGenerating Outline:\n`); 
  
  let outline = await fetch("/api/askOpenAI", {
    method: 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify({
      prompt: outlinePrompt, 
      role: 'writer',
      modelChoice: state.model.name, 
      tokens: (state.model.tokenLimit - (40 + state.padAmount)),
      temp: 0.9
      })
  }).then((res) => {
    return res;
  });

  outline = outline.choices[0].message.content;
  
  // readline.cursorTo(process.stdout,3,5);
  // process.stdout.write(`\x1b[36mHere is the raw outline:\n`);
  // readline.cursorTo(process.stdout,4,6);
  // process.stdout.write(`\x1b[36m${outline}`);
  return outline;
}

export async function statePopulator(state, keyVal) {
    console.log("FIRING STATE POPULATOR", state, keyVal);

    let statePopulatorPrompt = `I'm going to give you the outline of a book. From this outline, tell me the ${keyVal}. Use close to ${state.model.tokenLimit - (500 + state.rawOutline + state.padAmount)} words for this page. Here is the outline: ${state.rawOutline}`;

    let statePopulatorResult = await askOpenAI(statePopulatorPrompt, 'machine', state.model.name, (state.model.tokenLimit - (state.rawOutline.length + state.padAmount)), 0.9)

    console.log("POPULATOR RESULT" + statePopulatorResult)
    statePopulatorResult = statePopulatorResult.choices[0].message.content;

    return statePopulatorResult;
}