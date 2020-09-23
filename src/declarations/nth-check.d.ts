declare module "nth-check" {
    export default function nthCheck(
        formula: string
    ): (position: number) => boolean;
    export function parse(formula: string): [number, number];
    export function compile(
        parsed: [number, number]
    ): (position: number) => boolean;
}
