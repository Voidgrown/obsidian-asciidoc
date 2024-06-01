import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownRenderer, MarkdownPostProcessorContext } from 'obsidian';
import { AsciiDocViewEdit, VIEW_TYPE_ASCDOC_EDIT } from './views/view_editing_adoc.ts'
import { AsciiDocViewRead, VIEW_TYPE_ASCDOC_READ } from './views/view_reading_adoc.ts'
import AsciiDoctor from 'asciidoctor';

// The more mature spelling would be "Asc(iidoc)Obs(idian)", but I am a child
interface AssCobsPluginSettings {
	adocRenderActive: boolean;
}

const DEFAULT_SETTINGS: AssCobsPluginSettings = {
	adocRenderActive: true
}

export default class AssCobsPlugin extends Plugin {
	//#region Main Settings Handling 
	settings: AssCobsPluginSettings;
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

		// loads the data from persistent settings
		await this.loadSettings();

		// Enable viewing adoc files on the side
		this.registerExtensions(['adoc', 'asciidoc'], 'markdown');
		if(this.settings.adocRenderActive){
			this.registerView(VIEW_TYPE_ASCDOC_READ, (leaf: WorkspaceLeaf) => new AsciiDocView(leaf));
			this.registerView(VIEW_TYPE_ASCDOC_EDIT, (leaf: WorkspaceLeaf) => new AsciiDocView(leaf));

			// TODO: add an editor (https://docs.obsidian.md/Plugins/Editor/Editor+extensions) handler
			this.registerEditorExtension;

			// TODO: overwrite existing MD processor with this, if the active file is adoc
			this.registerMarkdownPostProcessor(async (element, context) => {
				postprocessAdoc(element, context);
			});
		}
		else {
			console.log("Adoc Rendering inactive. Refer to the settings tab to enable adoc rendering.")
		}

		// TODO: Add command for importing chapter
		// TODO: Add command for importing image

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AssCobsSettingTab(this.app, this));

		// DEBUG
		this.addRibbonIcon("book-open", "Activate READING View", () => { view_reading_adoc.activateView(); });
		this.addRibbonIcon("pen-line", "Activate EDITING View", () => { view_editing_adoc.activateView(); });
	}

	onunload() {
		console.log("Unloading Obsidian AsciiDoc. Goodbye!");
	}
	//#endregion

}

class AssCobsSettingTab extends PluginSettingTab {
	plugin: AssCobsPlugin;

	constructor(app: App, plugin: AssCobsPlugin) {
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
