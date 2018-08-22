export class JsonTest {
    constructor(public name: string, public file: string, public line: number) {}
}

export class JsonTestSuite {
    constructor(public name: string, public testsuite: JsonTest[]) {}
}

export class JsonEntry {
    constructor(public testsuites: JsonTestSuite[]) {}
}