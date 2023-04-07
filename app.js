require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const { askOpenAI } = require("./askOpenAI");

//GLOBALS
let modelChoice = process.argv[2] || 'gpt4';
let chapterLength = process.argv[4] || 20;
let desiredPages = process.argv[3] || 200;
let padAmount = process.argv[5] || 500;
let models = {
  'gpt35': {
    name: 'gpt-3.5-turbo',
    tokenLimit: 4097,
  },
  'gpt4': {
    name: 'gpt-4-0314',
    tokenLimit: 8000,
  } 
}

function getGenre() {
  let genresList = ['Action', 'Adventure', 'Alternative History', 'Apocalyptic', 'Children\'s', 'Comedy', 'Crime', 'Cyberpunk', 'Drama', 'Dystopian', 'Elizabethan', 'Existentialist', 'Fantasy', 'Gothic', 'Historical', 'Horror', 'Legal', 'LGBTQ', 'Magical Realism', 'Mystery', 'Near-future', 'Parable', 'Paranormal', 'Post-Apocalyptic', 'Romance', 'Postmodern', 'Science Fiction', 'Sports', 'Star Trek Fan Fiction', 'Steampunk', 'Superhero', 'Supernatural', 'Teenage', 'Thriller', 'Tragedy', 'Utopian', 'Victorian', 'Western', 'Young Adult'];
  console.clear();
  let randomGenre = genresList[Math.floor(Math.random() * genresList.length)];
  readline.cursorTo(process.stdout,1,1)
  process.stdout.write(`\x1b[35mGenre is: ${randomGenre}`);
  return randomGenre;
}

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

async function outlineGenerator(state){
  let outlinePrompt =  `Generate the outline of an original ${state.desiredPages}-page ${state.plotGenre} fiction book. Imagine and then carefully label the following: a detailed plot, characters with names, settings and writing style. You have ${models[modelChoice].tokenLimit - (40 + padAmount)} words remaining to write the outline. It is CRITICAL you as many words as possible.`;

  readline.cursorTo(process.stdout,2,2)
  process.stdout.write(`\x1b[36mGenerating Outline:\n`); 
  
  let outline = await askOpenAI(outlinePrompt, 'writer', models[modelChoice].name, (models[modelChoice].tokenLimit - (40 + padAmount)), 0.9)

  outline = outline.choices[0].message.content;
  
  readline.cursorTo(process.stdout,3,5);
  process.stdout.write(`\x1b[36mHere is the raw outline:\n`);
  readline.cursorTo(process.stdout,4,6);
  process.stdout.write(`\x1b[36m${outline}`);
  return outline;
}

async function main() {
  let state = {
    desiredPages: desiredPages,
    chapters: desiredPages / chapterLength,
    plotGenre: '',
    rawOutline: '',
    plotOutline: '',
    mainCharacters: [],
    minorCharacters: [],
    writingStyle: '',
    writingAdjectives: '',
    plotSettings: [],
    chapterByChapterSummaryString: '',
    chapterSummaryArray: [],
    filename: '',
    fullText: [],
    pageSummaries: [],
  }
  state.plotGenre = getGenre();
  state.filename = `${state.plotGenre}${modelChoice}${Math.round(Math.random()*100)}.txt`;
  state.rawOutline = await outlineGenerator(state);
  state = await statePopulator(state);
  state.chapterByChapterSummaryString = await plotSummaryByChapter(state);
  state.chapterSummaryArray = await chapterSummaryArray(state);
  state.pageSummaries = await pageGenerator(state);
}

async function statePopulator(state) {
  
  console.log('\nPopulating state from raw outline.\n')

  let itemsToPopulateHashMap = {
    'plotOutline': 'plot',
    'mainCharacters': 'main characters list',
    'minorCharacters': 'minor characters list',
    'plotSettings': 'setting',
    'writingStyle': 'writing style',
    'writingAdjectives': 'writing adjectives list'
  }

  for (const [key, keyVal] of Object.entries(itemsToPopulateHashMap)) {
    
    let statePopulatorPrompt = `I'm going to give you the outline of a book. From this outline, tell me the ${keyVal}. Use close to ${models[modelChoice].tokenLimit - (500 + state.rawOutline + padAmount)} words for this page. Here is the outline: ${state.rawOutline}`;

    let statePopulatorResult = await askOpenAI(statePopulatorPrompt, 'machine', models[modelChoice].name, (models[modelChoice].tokenLimit - (state.rawOutline.length + padAmount)), 0.9)

    console.log(statePopulatorResult)
    statePopulatorResult = statePopulatorResult.choices[0].message.content;

    state[key] = statePopulatorResult;
    process.stdout.write(`\n\x1b[36m here is the ${keyVal}: ${statePopulatorResult}\n`);
  }
  
  process.stdout.write(`\n\x1b[36mHere is the state object:\n`)
  let textToSave = '\n' + JSON.stringify(state) + '\n';
  fs.appendFile(state.filename, textToSave, (err) => {
    if (err) {throw err;}
  });
  console.log(state);
  return state;
}

async function plotSummaryByChapter(state) {
  console.log('\nGenerating chapter-by-chapter plot summary.\n');

  let chapterSummaryText = await askOpenAI(`You are writing a book with this plot summary: ${state.plotOutline}. The book is ${state.desiredPages} pages long. Write a specific and detailed plot SUMMARY for each of the ten chapters of the book. You must use at least a few paragraphs per chapter summary and can use up to one page or more per chapter. Name any unnamed major or minor characters. Use the first few chapter summaries to introduce the characters and set the story. Use the next few chapter summaries for action and character development. Use the last few chapters for dramatic twists in the plot and conclusion. You have ${models[modelChoice].tokenLimit - (state.plotOutline.length + 500 + padAmount)} tokens (or words) left for the summaries. Try to use all the words you have available.`, 'writer', models[modelChoice].name, (models[modelChoice].tokenLimit - (state.plotOutline.length + padAmount)), 0.9)
  
  let condition = true;
  while (condition == true) {
    try {
      console.log(chapterSummaryText);
      chapterSummaryText = chapterSummaryText.choices[0].message.content; 
      chapterSummaryText = chapterSummaryText.split(/\n/).filter((x) => x.length > 5);
      process.stdout.write(`\n\x1b[34mChapter-By-Chapter Plot Summary: ${chapterSummaryText}\n`)
      let textToSave = `\n\nChapter-By-Chapter Plot Summary: ${chapterSummaryText}\n`;
      fs.appendFile(state.filename, textToSave, (err) => {
        if (err) {throw err;}
      });
      return chapterSummaryText;
    }
    catch (err) {
    }
  }
}

async function chapterSummaryArray(state) {
  for (var i=0; i<state.chapters; i++){
    process.stdout.write(`\x1b[36mGenerating chapter summaries to populate chapterSummaryArray.\n`)

    let shortSummaryText = ''
    let condition = true;
    while (condition) {
      try {
        console.log(`\nGenerating short summary of Chapter ${i+1}:\n`);

        shortSummaryText = await askOpenAI(`You are writing a summary of Chapter ${i+1} of a ${state.chapters} chapter ${state.plotGenre} book. The entire plot summary is ${state.plotOutline} The chapter-by-chapter summary for the entire book is: \n${state.chapterByChapterSummaryString}\n Using those summaries, write a several page SUMMARY of ONLY chapter ${i+1}. Write the best summary you can, you may add new subplots, character development, character background, planned dialogue and plot development that you would typically find in such a work. You are NOT writing the actual book right now, you ARE writing an outline and SUMMARY of what will happen in this chapter. You have to write ${models[modelChoice].tokenLimit - (500 + state.plotOutline + state.chapterByChapterSummaryString.length + padAmount)} words.`, 'writer', models[modelChoice].name, (models[modelChoice].tokenLimit - (state.plotOutline + state.chapterByChapterSummaryString + padAmount)), 0.9)

        if (!shortSummaryText.choices[0]) {
          shortSummaryText = 'error'
        }
        if (!shortSummaryText.choices[0].message) {
          shortSummaryText = 'error'
        }
        if (!shortSummaryText.choices[0].message.content) {
          shortSummaryText = 'error';
        } else {
          shortSummaryText = shortSummaryText.choices[0].message.content;
          shortSummaryText = shortSummaryText.replace(/\n/g, '');
          state.chapterSummaryArray.push(shortSummaryText);
          process.stdout.write(`\r\x1b[35mHere is the chapter summary: \n${state.chapterSummaryArray[i]}\n`);
          condition = false;
          let textToSave = `\nChapter ${i} Summary` + state.chapterSummaryArray[i] + '\n';
          fs.appendFile(state.filename, textToSave, (err) => {
            if (err) {throw err;}
          });
        }        
      } catch (err) {
        console.log(err);
      }
    }
  }
  return state;
}

async function pageGenerator(state) {

  console.log('\nEntering Page Generation module.\n');

  for (var i=0; i<state.chapters; i++){
    for (var j=0; j<20; j++) {

      // let pageToWrite = i*20 + j+1;
      amendment = createPageQueryAmendment(state, i, j);

      console.log('\nGenerating final full text for chapter ', i+1, ' page ', j+1, '\n');

      let pageGenText = ''
      let condition = true;
      while (condition == true) {
        try {
          pageGenText = await askOpenAI(`You are an author writing page ${j+1} in chapter ${i+1} of a ${state.chapters}-chapter ${state.plotGenre} novel. The plot summary for this chapter is ${state.chapterSummaryArray[i]}. ${amendment}. As you continue writing the next page, be sure to develop the characters' background thoroughly, include dialogue and detailed literary descriptions of the scenery, and develop the plot. Do not mention page or chapter numbers! Do not jump to the end of the plot and make sure there is plot continuity. Carefully read the summaries of the prior pages before writing new plot. Make sure you fill an entire page of writing.`, 'writer', models[modelChoice].name, (models[modelChoice].tokenLimit - (state.chapterSummaryArray[i] + amendment)), 0.9)
          
          if (!pageGenText.choices) {
            console.log('error in pageGenText')
            console.log(pageGenText)
            pageGenText = 'error'
          }
          if (!pageGenText.choices[0]) {pageGenText = 'error'}
          if (!pageGenText.choices[0].message) {pageGenText = 'error'}
          if (!pageGenText.choices[0].message.content) {
            pageGenText = 'error'
          } else {
            pageGenText = pageGenText.choices[0].message.content;
            pageGenText = pageGenText.replace(/\n/g, '');
            state.fullText.push((pageGenText + "\n"));
            process.stdout.write(`\x1b[36m\n\n\nChapter ${i+1}\n\nPage ${j+1}\n\n ${pageGenText}\n\n`);
            let header = `\n\nChapter ${i+1}, Page ${j+1}\n\n`;
            let textToSave = header + pageGenText;

            fs.appendFile(state.filename, textToSave, (err) => {
              if (err) {throw err;}
            });

            condition = false;

            async function generatePageSummary(page) {
              let condition = true;
              while (condition) {
                try {
                  let pageSummaryText = await askOpenAI(`Here is a full page of text. Please summarize it in a few sentences. Text to summarize: ${page}`, 'machine', models[modelChoice].name, (models[modelChoice].tokenLimit - (page.length + padAmount)), 0.5);
                  
                  if (!pageSummaryText.choices) {
                    console.log(pageSummaryText)
                    pageSummaryText = 'error'
                  }
                  if (!pageSummaryText.choices[0]) {
                    console.log(pageSummaryText)
                    pageSummaryText = 'error'
                  } else {
                    pageSummaryText = pageSummaryText.choices[0].message.content;
                    condition = false;
                  }
                } catch (err) {
                  console.log(err)
                }
              }
              return page;
            }
            let pageSummary = await generatePageSummary(pageGenText)
            state.pageSummaries.push(pageSummary);
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  }
}

function createPageQueryAmendment(state, i, j) {

  let amendment = "";

  if (j == 0) {
    amendment = "This is the first page of the chapter.";
    return amendment;
  }

  if (j == 1 && modelChoice == 'gpt4') {
    amendment = `Page 1 of this chapter reads as follows: \n${state.fullText[(i*20 + j-1)]}\n`
    return amendment;
  };

  if (j == 2 && modelChoice == 'gpt4') {
    amendment = `Pages ${j-1} reads as follows: \n${state.fullText[(i*20 + j-2)]}\n Page ${j} reads as follows: ${state.fullText[(i*20 + j-1)]}\n`;
    return amendment;
  }

  //join the state.sentenceSummaries of all prior pages in the chapter so far
  let priorPages = '';

  for (var k=0; k<j; k++) {
    if (k == 0) {priorPages = ''; return;};
    priorPages = priorPages + (`\nChapter ${i+1}, Page ${k+1}: ${state.sentenceSummaries[(i*20 + k)]}\n`);
  }

  if (j > 2 && modelChoice == 'gpt4') {
    amendment = `Here are the page summaries of the chapter thus far: ${priorPages}. The full text of pages ${j-2},${j-1} and ${j} read as follows: Page ${j-2}: ${state.fullText[(i*20 + j-3)]} Page ${j-1}: ${state.fullText[(i*20 + j-2)]} Page ${j}: ${state.fullText[(i*20 + j-1)]}`;
  }

  if (j > 0 && modelChoice == 'gpt35') {
    amendment = `Here are the page summaries of the chapter thus far: ${priorPages}. Here is the full text of page ${j}: ${state.fullText[(i*20 + j-1)]}`
  }

  return amendment;
}

main();

//1. Identify what the main theme or plot of the novel is going to be
//2. Brainstorm ideas for the main characters, their traits, and struggles.
//3. Create a timeline for the novel, including significant events and developments that will take place.
//4. Develop a setting for the novel, either real or imaginary.
//5. Establish the main characters and their motivations.
//6. Introduce the initial conflict and how it will be solved.
//7. Develop sub-plots for the novel using the characters and their struggles.
//8. Introduce necessary complications, such as other characters, that will further the story.
//9. Describe the environments, scenery, and settings that the characters will interact with
//10. Develop the climax of the novel and resolve the conflict
//11. Describe the resolution of the novel, explaining how it all wraps up
//12. Run the novel through Open AI and have it generate successive, non-repetitive chapters based on the initial input and timeline