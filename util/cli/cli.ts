// cli.ts
import readline from "readline";

class CLI {
  private args: string[];

  constructor() {
    this.args = process.argv.slice(2);
  }

  // Ambil argumen CLI
  public lineInput(): string[] {
    return this.args;
  }

  // Prompt seperti Python input()
  public input(question: string = ""): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(question, (answer: string) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

export default new CLI();