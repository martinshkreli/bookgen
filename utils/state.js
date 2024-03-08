export function defaultAppState(config) {
  //GLOBALS
  let modelChoice = config?.modelChoice || 'gpt4';
  let chapterLength = config?.chapterLength || 20;
  let desiredPages = config?.desiredPages || 200;
  let padAmount = config?.padAmount || 500;

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

  return {
    model: models[config?.modelChoice], 
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
}