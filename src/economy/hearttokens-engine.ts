export interface HeartWallet {
    userId: string;
    balance: number;
    history: Transaction[];
}

export interface Transaction {
    id: string;
    amount: number;
    type: 'EARN' | 'SPEND';
    reason: string;
    timestamp: number;
}

export const REWARDS = {
    DAILY_LOGIN: 10,
    COMPLETE_PROFILE: 50,
    ATTEND_EVENT: 100,
    RESPECTFUL_CHAT: 5
};

export const COSTS = {
    BOOST_PROFILE: 50,
    SUPER_LIKE: 20,
    EVENT_HIGHLIGHT: 200
};

export function processTransaction(wallet: HeartWallet, amount: number, type: 'EARN' | 'SPEND', reason: string): HeartWallet {
    if (type === 'SPEND' && wallet.balance < amount) {
        throw new Error("Insufficient HeartTokens");
    }

    const newBalance = type === 'EARN' ? wallet.balance + amount : wallet.balance - amount;

    const w = { ...wallet, balance: newBalance };
    w.history.push({
        id: Math.random().toString(36),
        amount,
        type,
        reason,
        timestamp: Date.now()
    });

    return w;
}
