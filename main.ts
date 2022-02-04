import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface ObsidianBiblePluginSettings {
	scriptureFolder: string;
}

const DEFAULT_SETTINGS: ObsidianBiblePluginSettings = {
	scriptureFolder: "Scripture",
};

export default class ObsidianBiblePlugin extends Plugin {
	settings: ObsidianBiblePluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		/**
		 * Convert Scripture link text into readable format
		 * e.g. Scripture/KJV/Philippians/Phil 4#5 becomes Phil 4:5
		 */
		this.registerMarkdownPostProcessor((postProcessor) => {
			[...postProcessor.querySelectorAll("a")]
				.filter((element) =>
					element.innerText.contains(
						`${this.settings.scriptureFolder}/`
					)
				)
				.forEach((element) => {
					const regex = new RegExp(
						`${this.settings.scriptureFolder}.*\/`,
						"g"
					);
					element.innerText = element.innerText
						.replace(regex, "")
						.replace(" > ", ":");
				});
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: ObsidianBiblePlugin;

	constructor(app: App, plugin: ObsidianBiblePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Settings for my Obsidian Bible Enhanced plugin.",
		});

		new Setting(containerEl)
			.setName("Scripture Folder")
			.setDesc("Path to folder containing scripture")
			.addText((text) =>
				text
					.setPlaceholder("Enter scripture folder")
					.setValue(this.plugin.settings.scriptureFolder)
					.onChange(async (value) => {
						this.plugin.settings.scriptureFolder = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
