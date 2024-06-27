import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext, TFile, setIcon, addIcon } from 'obsidian';
// TODO: Is this gonna be necessary?
//import { AsciiDocViewEdit, VIEW_TYPE_ASCDOC_EDIT } from './views/view_editing_adoc'
import { AsciiDocEditorPlugin } from './views/view_editing_adoc'
import { AsciiDocViewRead, VIEW_TYPE_ASCDOC_READ } from './views/view_reading_adoc'


interface AsciiDocObsidianPluginSettings {
	adocRenderActive: boolean;
}

const DEFAULT_SETTINGS: AsciiDocObsidianPluginSettings = {
	adocRenderActive: true
}

let app: App;

export default class AsciiDocObsidianPlugin extends Plugin {
	//#region Main Settings Handling 
	settings: AsciiDocObsidianPluginSettings;
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
	//#endregion
	
	//#region Loadstate Handling 
	async onload() {
		app = this.app;

		// loads the data from persistent settings
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AsciiDocObsidianSettingTab(this.app, this));

		if(!this.settings.adocRenderActive){
			this.registerExtensions(['adoc', 'asciidoc'], "markdown");
			return
		}
		else{
			// Enable viewing adoc files on the side
			this.registerExtensions(['adoc', 'asciidoc'], VIEW_TYPE_ASCDOC_READ);
			// TODO: https://docs.obsidian.md/Plugins/Editor/View+plugins
			//this.registerEditorExtension([AsciiDocObsidianPlugin, AsciiDocEditorPlugin]);
		}
		this.registerView(VIEW_TYPE_ASCDOC_READ, (leaf: WorkspaceLeaf) => new AsciiDocViewRead(leaf));
		// TODO: Editview necessity?
		//this.registerView(VIEW_TYPE_ASCDOC_EDIT, (leaf: WorkspaceLeaf) => new AsciiDocViewEdit(leaf));
		// TODO: Add command for importing chapter
		// TODO: Add command for importing image
		// TODO: Search integration

		// Register the command to switch views
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.addViewToggleAction();
			})
		);
		// Add the view toggle action when the plugin loads
		this.addViewToggleAction();

		const eventRef = app.workspace.on('file-open', async (file) => {
			// Check if the opened file is adoc
			if (file?.extension === 'adoc' || file?.extension === 'asciidoc') {
				const leaf = app.workspace.getLeaf(false);
				//leaf.setViewState({ type: VIEW_TYPE_ASCDOC_READ, active: true });
				leaf.openFile(file, {active: true});
			}
		});
		this.registerEvent(eventRef);
	}

	onunload() {
		// nope, antipattern. Leaf should stay where the user put it.
		//app.workspace.detachLeavesOfType(VIEW_TYPE_ASCDOC_READ);
		//app.workspace.detachLeavesOfType(VIEW_TYPE_ASCDOC_EDIT);
	}
	//#endregion

	addViewToggleAction() {
		const view = this.app.workspace.getActiveViewOfType(AsciiDocViewRead);
  
		if (view) {
			const viewActions = view.containerEl.querySelector('.view-actions');
			console.debug(viewActions);
			if (viewActions && !viewActions.querySelector('.view-action-toggle')) {
				
				const button = document.createElement('button');
				button.className = 'clickable-icon view-action';
				setIcon(button, "pencil-line");
				button.onclick = () => this.switchToEditView(view);
				
				viewActions.appendChild(button);
			}
		}
	}
	
	switchToEditView(view: AsciiDocViewRead) {
		const leaf = view.leaf;
		leaf.setViewState({
		  type: 'markdown',
		  state: view.getState(),
		});
	  }

}

class AsciiDocObsidianSettingTab extends PluginSettingTab {
	plugin: AsciiDocObsidianPlugin;

	constructor(app: App, plugin: AsciiDocObsidianPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			// AsciiDoc is capitalized this way originally
			.setName('Enable AsciiDoc rendering')
			.setDesc('When disabled, this will display your adoc files as raw Obsidian would try to. Files will remain visible in the explorer.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.adocRenderActive)
				.onChange(async (value) => {
					this.plugin.settings.adocRenderActive = value;
					await this.plugin.saveSettings();
				}));
	}
}
