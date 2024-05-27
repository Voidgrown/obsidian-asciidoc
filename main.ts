import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf } from 'obsidian';
import AsciiDoctor from 'asciidoctor';

// The more mature spelling would be "Asc(iidoc)Obs(idian)", but I am a child
interface AssCobsPluginSettings {
	adocRenderActive: boolean;
}

const DEFAULT_SETTINGS: AssCobsPluginSettings = {
	// todo: implement handling of this setting
	adocRenderActive: true
}

export default class AssCobsPlugin extends Plugin {
	settings: AssCobsPluginSettings;

	async onload() {
		console.log("Loading plugin Obsidian AsciiDoc. Welcome!");

		// loads the data from persistent settings
		await this.loadSettings();

		// Enable viewing adoc files on the side
		this.registerExtensions(['adoc', 'asciidoc'], 'markdown');
		this.registerView(VIEW_TYPE_ASCDOC_READ, (leaf: WorkspaceLeaf) => new AsciiDocView(leaf));
		// Enables our custom processor. Won't be markdown, of course. 
		this.registerMarkdownPostProcessor(async (el, ctx) => {
		  const pre = el.querySelector('pre');
		  if (pre?.textContent) {
			const asciidoctor = AsciiDoctor();
			const html:string = asciidoctor.convert(pre.textContent) as string;
			el.innerHTML = html;
		  }
		});

		// TODO: Add command for importing chapter
		// TODO: Add command for importing image

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AssCobsSettingTab(this.app, this));
	}

	onunload() {
		console.log("Unloading Obsidian AsciiDoc. Goodbye!");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
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

  
export const VIEW_TYPE_ASCDOC_READ = "asciidoc-read-view";
class AsciiDocView extends ItemView {  
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// Initialize your view here
	}

	getViewType() {
		return VIEW_TYPE_ASCDOC_READ;
	}

	getDisplayText() {
		return "AsciiDoc Reading View";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "AsciiDoc Reading View" });
	}

	async onClose() {
		// Nothing to clean up.
	}
}
