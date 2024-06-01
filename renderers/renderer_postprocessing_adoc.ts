import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext } from 'obsidian';


export function postprocessAdoc(element:HTMLElement, context:MarkdownPostProcessorContext){
	const filePath = this.app.workspace.getActiveFile()?.path ?? '';
	if (filePath.endsWith(".adoc") || filePath.endsWith(".asciidoc")){
		if (element?.textContent) {
			// TODO: Actually it would appear that this method sucks and I'll have to do my own
			const asciidoctor = AsciiDoctor();
			const html:string = asciidoctor.convert(element.textContent) as string;
			console.log(html);
			element.innerHTML = html;
		}
	}
	else {

	}
}
