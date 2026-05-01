function pronoun(str) {
  const pronouns = ['i', 'you', 'he', 'she', 'it', 'they', 'we'];
  const result = {};

  const words = str.split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z]/gi, ''));
  
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    
    if (pronouns.includes(current)) {
      if (!result[current]) {
        result[current] = { word: [], count: 0 };
      }
      result[current].count += 1;

      const next = words[i + 1];
      if (next && !pronouns.includes(next)) {
        result[current].word.push(next);
      }
    }
  }

  return result;
}
