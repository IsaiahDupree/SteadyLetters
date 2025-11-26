/**
 * Template variable substitution
 * Replaces {{variable}} placeholders with actual values
 */

export interface TemplateVariables {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    company?: string;
    [key: string]: string | undefined;
}

/**
 * Substitute variables in a template string
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns String with variables replaced
 */
export function substituteVariables(
    template: string,
    variables: TemplateVariables
): string {
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
export function extractVariables(template: string): string[] {
    const regex = /{{\s*(\w+)\s*}}/g;
    const matches = template.matchAll(regex);
    const variables = new Set<string>();

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
export function getMissingVariables(
    template: string,
    variables: TemplateVariables
): string[] {
    const required = extractVariables(template);
    const missing: string[] = [];

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
export function previewTemplate(
    template: string,
    variables: TemplateVariables
): { preview: string; missing: string[] } {
    const missing = getMissingVariables(template, variables);
    let preview = substituteVariables(template, variables);

    // Mark missing variables
    missing.forEach((varName) => {
        const regex = new RegExp(`{{\\s*${varName}\\s*}}`, 'gi');
        preview = preview.replace(regex, `[MISSING: ${varName}]`);
    });

    return { preview, missing };
}
