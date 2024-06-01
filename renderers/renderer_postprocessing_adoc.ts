// import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext } from 'obsidian';
import AsciiDoctor from 'asciidoctor';
const asciidoctor = AsciiDoctor();

export function postprocessAdoc(element:string){
	const filePath = this.app.workspace.getActiveFile()?.path ?? '';
	let html:string = "";
	if (filePath.endsWith(".adoc") || filePath.endsWith(".asciidoc")){
		html = asciidoctor.convert(element, { safe: 'safe' }) as string;
	}
	// TODO: the css injection here is stolen from chatgpt, so replace it aight
	injectCss(html, "./styles.css").then(injectedHtml => {
		const container = document.getElementById('asciidoc-container');
		if (container) container.innerHTML = injectedHtml;
	  });
	return html;
}

async function injectCss(html: string, cssUrl: string): Promise<string> {
	const response = await fetch(cssUrl);
	const css = await response.text();
	return `<style>${css}</style>${html}`;
  }
