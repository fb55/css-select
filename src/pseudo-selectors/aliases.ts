/**
 * Only text controls can be made read-only, since for other controls (such
 * as checkboxes and buttons) there is no useful distinction between being
 * read-only and being disabled.
 * @see {@link https://html.spec.whatwg.org/multipage/input.html#attr-input-readonly}
 */
const textControl =
    "input:is([type=text i],[type=search i],[type=url i],[type=tel i],[type=email i],[type=password i],[type=date i],[type=month i],[type=week i],[type=time i],[type=datetime-local i],[type=number i])";

/**
 * Aliases are pseudos that are expressed as selectors.
 */
export const aliases: Record<string, string> = {
    // Links

    "any-link": ":is(a, area, link)[href]",
    link: ":any-link:not(:visited)",

    // Forms

    // https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
    disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
    enabled:
        ":is(button, input, select, textarea, optgroup, option, fieldset):not(:disabled)",
    checked:
        ":is(:is(input[type=radio], input[type=checkbox])[checked], :selected)",
    required: ":is(input, select, textarea)[required]",
    optional: ":is(input, select, textarea):not([required])",

    "read-only": `[readonly]:is(textarea, ${textControl})`,
    "read-write": `:not([readonly]):is(textarea, ${textControl})`,

    // JQuery extensions

    checkbox: "[type=checkbox]",
    file: "[type=file]",
    password: "[type=password]",
    radio: "[type=radio]",
    reset: "[type=reset]",
    image: "[type=image]",
    submit: "[type=submit]",

    parent: ":not(:empty)",
    header: ":is(h1, h2, h3, h4, h5, h6)",

    button: ":is(button, input[type=button])",
    input: ":is(input, textarea, select, button)",
    text: "input:is(:not([type!='']), [type=text])",
};
