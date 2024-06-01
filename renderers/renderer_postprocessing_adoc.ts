// import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext } from 'obsidian';
import AsciiDoctor from 'asciidoctor';
const asciidoctor = AsciiDoctor();

export function postprocessAdoc(element:string){
	const filePath = this.app.workspace.getActiveFile()?.path ?? '';
	let html:string = "";
	if (filePath.endsWith(".adoc") || filePath.endsWith(".asciidoc")){
		html = asciidoctor.convert(element) as string;
	}
	return html;
}
