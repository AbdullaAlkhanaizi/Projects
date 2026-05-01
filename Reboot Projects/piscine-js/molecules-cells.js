function RNA(dna) {
    const map = { G: 'C', C: 'G', T: 'A', A: 'U' };
    let result = '';

    for (let i = 0; i < dna.length; i++) {
        const c = dna[i];
        result += map[c];
    }

    return result;
}

function DNA(rna) {
    const map = { C: 'G', G: 'C', A: 'T', U: 'A' };
    let result = '';

    for (let i = 0; i < rna.length; i++) {
        const c = rna[i];
        result += map[c];
    }

    return result;
}
