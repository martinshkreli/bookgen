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


export async function plotSummaryGenerator(state) {
  console.log("FIRING PLOT SUMMARY", state, keyVal);

  // This is hardcoded to 10 chapters, should it take the number of chapters from the state config?
  let chapterSummaryPrompt = `You are writing a book with this plot summary: ${state.plotOutline}. The book is ${state.desiredPages} pages long. Write a specific and detailed plot SUMMARY for each of the ten chapters of the book. You must use at least a few paragraphs per chapter summary and can use up to one page or more per chapter. Name any unnamed major or minor characters. Use the first few chapter summaries to introduce the characters and set the story. Use the next few chapter summaries for action and character development. Use the last few chapters for dramatic twists in the plot and conclusion. You have ${models[modelChoice].tokenLimit - (state.plotOutline.length + 500 + padAmount)} tokens (or words) left for the summaries. Try to use all the words you have available.`;

  return await fetch("/api/askOpenAI", {
    method: 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'body': JSON.stringify({
      prompt: chapterSummaryPrompt, 
      role: 'writer',
      modelChoice: state.model.name, 
      tokens: (state.model.tokenLimit - (state.plotOutline.length + state.padAmount)),
      temp: 0.9
      })
  }).then((res) => res.json())
    .then((res) => {
      return res.choices[0].message.content;
  }).catch((err) =>{
    return err;
  })
}


export async function plotChapterArrayGenerator(state) {
  let chapterSummaryArray = [];
  for (var i=0; i < state.chapters; i++){
    let shortSummaryText = ''
    console.log(`Generating short summary of Chapter ${i+1}:`);

    const shortSummaryPrompt = `You are writing a summary of Chapter ${i+1} of a ${state.chapters} chapter ${state.plotGenre} book. The entire plot summary is ${state.plotOutline} The chapter-by-chapter summary for the entire book is: \n${state.chapterByChapterSummaryString}\n Using those summaries, write a several page SUMMARY of ONLY chapter ${i+1}. Write the best summary you can, you may add new subplots, character development, character background, planned dialogue and plot development that you would typically find in such a work. You are NOT writing the actual book right now, you ARE writing an outline and SUMMARY of what will happen in this chapter. You have to write ${state.model.tokenLimit - (500 + state.plotOutline.length + state.chapterByChapterSummaryString.length + state.padAmount)} words.`;

    await fetch("/api/askOpenAI", {
      method: 'POST',
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify({
        prompt: shortSummaryPrompt, 
        role: 'writer',
        modelChoice: state.model.name, 
        tokens: (state.model.tokenLimit - (state.plotOutline.length + state.chapterByChapterSummaryString + state.padAmount)),
        temp: 0.9
        })
    }).then((res) => res.json())
    .then((res) => {
        console.log(`chapter summary array result ${i + 1}`, res.choices?.[0]?.message?.content);
        shortSummaryText = res.choices?.[0]?.message?.content || "error";
        chapterSummaryArray.push(shortSummaryText);
    }).catch((err) =>{
      return err;
    }) 
  }
  return chapterSummaryArray;
}