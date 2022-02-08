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
			postProcessor.querySelectorAll("a").forEach((element) => {
				this.formatVerseLink(element);
			});
		});

		// Register a format backlinks function run every 1 second
		this.registerInterval(
			window.setInterval(this.formatBacklinks.bind(this), 1000)
		);
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

	formatVerseLink(element: HTMLElement, isEmbed?: boolean) {
		element.addClass("be__formatted");

		if (!element.innerText.contains(`${this.settings.scriptureFolder}/`)) {
			return;
		}

		const regex = new RegExp(`${this.settings.scriptureFolder}.*\/`, "g");
		element.innerText = element.innerText
			.replace(regex, "")
			.replace(" > ", ":");
		if (isEmbed) {
			element.innerText = element.innerText.replace("#", ":");
			element.innerText = element.innerText.replace(/\[|\]/g, "");
		}
	}

	formatBacklinks(): void {
		this.app.workspace.containerEl
			.querySelectorAll<HTMLElement>(
				".search-result-file-match span:not(.be__formatted)"
			)
			.forEach((element) => {
				this.formatVerseLink(element, true);
			});
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
