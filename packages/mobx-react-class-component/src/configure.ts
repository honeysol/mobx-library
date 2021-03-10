interface ConfigOption {
  verbose?: boolean;
}
export const configOption: ConfigOption = {};
export const configure = (newOption: ConfigOption) => {
  Object.assign(configOption, newOption);
};
