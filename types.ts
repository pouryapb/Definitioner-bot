// **<word>** <phonetic>
//
// __<partOfSpeach>__
// <definition>
// "<example?>"
// Synonims?: <synonims?>
//
// ---
//

export interface Phonetic {
  text: string;
  audio: string;
  sourceUrl: string;
  license: {
    name: string;
    url: string;
  };
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
}

export interface Definition {
  definition: string;
  synonyms: string[];
  antonyms: string[];
  example?: string;
}

export interface WordDefinition {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  license: {
    name: string;
    url: string;
  };
  sourceUrls: string[];
}
