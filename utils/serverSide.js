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
  return await fetch("/api/askOpenAI", {
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
  }).then((res) => res.json())
  .then((res) => {
    return res.choices[0].message.content;
  }).catch((err) =>{
    return err;
  })
}

export async function statePopulator(state, keyVal) {
    console.log("FIRING STATE POPULATOR", state, keyVal);

    let statePopulatorPrompt = `I'm going to give you the outline of a book. From this outline, tell me the ${keyVal}. Use close to ${state.model.tokenLimit - (500 + state.rawOutline + state.padAmount)} words for this page. Here is the outline: ${state.rawOutline}`;
    return await fetch("/api/askOpenAI", {
      method: 'POST',
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify({
        prompt: statePopulatorPrompt, 
        role: 'machine',
        modelChoice: state.model.name, 
        tokens: (state.model.tokenLimit - (state.rawOutline.length + state.padAmount)),
        temp: 0.9
        })
    }).then((res) => res.json())
    .then((res) => {
      return res.choices[0].message.content;
    }).catch((err) =>{
      return err;
    })
}