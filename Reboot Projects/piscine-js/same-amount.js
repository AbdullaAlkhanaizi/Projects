function sameAmount(str, reg1, reg2) {
    const r1 = new RegExp(reg1.source, reg1.flags.includes('g') ? reg1.flags : reg1.flags + 'g');
    const r2 = new RegExp(reg2.source, reg2.flags.includes('g') ? reg2.flags : reg2.flags + 'g');

    const matches1 = [...str.matchAll(r1)];
    const matches2 = [...str.matchAll(r2)];

    return matches1.length === matches2.length;
}
