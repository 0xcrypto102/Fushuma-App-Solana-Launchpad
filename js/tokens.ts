export const TokenAddress = new Map<string, string>([
    ['So11111111111111111111111111111111111111112', 'wSOL'],
    ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'],
]);

export const convertTokenIfAvailable = (token: string) => {
    return TokenAddress.has(token) ? TokenAddress.get(token) : token;
};

export const convertTokenIfAvailableWithFormatting = (token: string) => {
    return TokenAddress.has(token) ? TokenAddress.get(token) : token.slice(0, 4) + '...' + token.slice(-4);
};
