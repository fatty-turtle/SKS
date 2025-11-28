import * as Handlebars from 'handlebars';

export class PromptRenderer {
  private static cache = new Map<string, Handlebars.TemplateDelegate>();

  static render(template: string | undefined, vars: any): string | undefined {
    if (!template) return undefined;
    if (!this.cache.has(template)) {
      this.cache.set(template, Handlebars.compile(template, { noEscape: true }));
    }
    return this.cache.get(template)!(vars);
  }
}
