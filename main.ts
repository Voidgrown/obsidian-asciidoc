import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { AsciiDocViewEdit, VIEW_TYPE_ASCDOC_EDIT } from './views/view_editing_adoc'
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
		console.log("Loading plugin Obsidian AsciiDoc. Welcome!");

		app = this.app;

		// loads the data from persistent settings
		await this.loadSettings();

		// Enable viewing adoc files on the side
		this.registerExtensions(['adoc', 'asciidoc'], 'markdown');
		if(this.settings.adocRenderActive){
			this.registerView(VIEW_TYPE_ASCDOC_READ, (leaf: WorkspaceLeaf) => new AsciiDocViewRead(leaf));
			this.registerView(VIEW_TYPE_ASCDOC_EDIT, (leaf: WorkspaceLeaf) => new AsciiDocViewEdit(leaf));
		}
		else {
			console.log("Adoc Rendering inactive. Refer to the settings tab to enable adoc rendering.")
		}

		// TODO: Add command for importing chapter
		// TODO: Add command for importing image

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AsciiDocObsidianSettingTab(this.app, this));

		app.workspace.on('file-open', async (file) => {
			// Check if the opened file is adoc
			if (file?.extension === 'adoc' || file?.extension === 'asciidoc') {
				app.workspace.trigger('file-open', { file, source: 'AsciiDocPlugin' });
				activateReadView(file);
			}
		});
		

		// DEBUG
		this.addRibbonIcon("plug-zap", "DEBUG", () => { console.log("debug"); });
	}

	onunload() {
		console.log("Unloading Obsidian AsciiDoc. Goodbye!");
		app.workspace.detachLeavesOfType(VIEW_TYPE_ASCDOC_READ);
		app.workspace.detachLeavesOfType(VIEW_TYPE_ASCDOC_EDIT);
		console.debug("Number of leaves of type ascdoc-read should be 0; is {0}".format(app.workspace.getLeavesOfType(VIEW_TYPE_ASCDOC_READ).length.toString()))
	}
	//#endregion

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
			.setName('Enable AsciiDoc Rendering')
			.setDesc('When disabled, this will display your adoc files as raw Obsidian would try to. Files will remain visible in the explorer.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.adocRenderActive)
				.onChange(async (value) => {
					this.plugin.settings.adocRenderActive = value;
					await this.plugin.saveSettings();
				}));
	}
}


// TODO: move or remove from main
async function activateReadView(file:TFile) {
	// TODO: I thought this would work, but lets try the tutorial's version and debug from there again
	//console.debug("Activating read view for file {0}".format(file.name))
	//const leaf = app.workspace.getLeaf(false);
	//await leaf!.setViewState({ type: VIEW_TYPE_ASCDOC_READ, active: true });
	//leaf!.openFile(file);

	const { workspace } = app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_ASCDOC_READ);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getLeaf(false);
      await leaf!.setViewState({ type: VIEW_TYPE_ASCDOC_READ, active: true });
	  leaf!.openFile(file);
    }
    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf!);
 }