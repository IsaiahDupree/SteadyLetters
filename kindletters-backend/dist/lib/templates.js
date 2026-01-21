"use strict";
/**
 * Template variable substitution
 * Replaces {{variable}} placeholders with actual values
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.substituteVariables = substituteVariables;
exports.extractVariables = extractVariables;
exports.getMissingVariables = getMissingVariables;
exports.previewTemplate = previewTemplate;
/**
 * Substitute variables in a template string
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns String with variables replaced
 */
function substituteVariables(template, variables) {
    let result = template;
    // Replace {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
        if (value) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
            result = result.replace(regex, value);
        }
    });
    // Handle common derived variables
    if (variables.firstName && variables.lastName && !variables.fullName) {
        const fullName = `${variables.firstName} ${variables.lastName}`;
        result = result.replace(/{{\s*fullName\s*}}/gi, fullName);
    }
    return result;
}
/**
 * Extract variable names from a template
 * @param template - Template string
 * @returns Array of variable names found in template
 */
function extractVariables(template) {
    const regex = /{{\s*(\w+)\s*}}/g;
    const matches = template.matchAll(regex);
    const variables = new Set();
    for (const match of matches) {
        variables.add(match[1]);
    }
    return Array.from(variables);
}
/**
 * Validate that all required variables are provided
 * @param template - Template string
 * @param variables - Provided variables
 * @returns Array of missing variable names
 */
function getMissingVariables(template, variables) {
    const required = extractVariables(template);
    const missing = [];
    required.forEach((varName) => {
        if (!variables[varName]) {
            missing.push(varName);
        }
    });
    return missing;
}
/**
 * Preview template with variables
 * Replaces variables and marks missing ones
 */
function previewTemplate(template, variables) {
    const missing = getMissingVariables(template, variables);
    let preview = substituteVariables(template, variables);
    // Mark missing variables
    missing.forEach((varName) => {
        const regex = new RegExp(`{{\\s*${varName}\\s*}}`, 'gi');
        preview = preview.replace(regex, `[MISSING: ${varName}]`);
    });
    return { preview, missing };
}
