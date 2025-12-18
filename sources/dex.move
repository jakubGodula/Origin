module origin::dex {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};

    /// Errors
    const EInsufficientBalance: u64 = 0;
    const EZeroAmount: u64 = 1;

    /// A simple trading pool for two assets X and Y.
    /// This is a simplified XY=K AMM for demonstration.
    public struct Pool<phantom X, phantom Y> has key {
        id: UID,
        balance_x: Balance<X>,
        balance_y: Balance<Y>,
        fee_bp: u64, // Basis points (e.g., 30 = 0.3%)
    }

    /// Admin capability to create pools? For now, public.
    
    /// Create a new pool
    public entry fun create_pool<X, Y>(
        token_x: Coin<X>,
        token_y: Coin<Y>,
        ctx: &mut TxContext
    ) {
        let balance_x = coin::into_balance(token_x);
        let balance_y = coin::into_balance(token_y);

        let pool = Pool<X, Y> {
            id: object::new(ctx),
            balance_x,
            balance_y,
            fee_bp: 30, // Default 0.3%
        };

        transfer::share_object(pool);
    }

    /// Swap Token X for Token Y
    public fun swap_x_to_y<X, Y>(
        pool: &mut Pool<X, Y>,
        payment: Coin<X>,
        ctx: &mut TxContext
    ): Coin<Y> {
        let amount_in = coin::value(&payment);
        assert!(amount_in > 0, EZeroAmount);

        let x_res = balance::value(&pool.balance_x);
        let y_res = balance::value(&pool.balance_y);

        // Simple Constant Product: (x + dx)(y - dy) = xy
        // y - dy = xy / (x + dx)
        // dy = y - (xy / (x + dx))
        
        // Fee deduction
        let amount_in_after_fee = amount_in * (10000 - pool.fee_bp) / 10000;
        
        let new_x = x_res + amount_in_after_fee;
        let new_y = (x_res * y_res) / new_x;
        let amount_out = y_res - new_y;

        assert!(amount_out > 0 && amount_out < y_res, EInsufficientBalance);

        // Update reserves
        balance::join(&mut pool.balance_x, coin::into_balance(payment));
        let payout = balance::split(&mut pool.balance_y, amount_out);

        coin::from_balance(payout, ctx)
    }

    /// Swap Token Y for Token X
    public fun swap_y_to_x<X, Y>(
        pool: &mut Pool<X, Y>,
        payment: Coin<Y>,
        ctx: &mut TxContext
    ): Coin<X> {
        let amount_in = coin::value(&payment);
        assert!(amount_in > 0, EZeroAmount);

        let x_res = balance::value(&pool.balance_x);
        let y_res = balance::value(&pool.balance_y);

        let amount_in_after_fee = amount_in * (10000 - pool.fee_bp) / 10000;

        let new_y = y_res + amount_in_after_fee;
        let new_x = (x_res * y_res) / new_y;
        let amount_out = x_res - new_x;

        assert!(amount_out > 0 && amount_out < x_res, EInsufficientBalance);

        balance::join(&mut pool.balance_y, coin::into_balance(payment));
        let payout = balance::split(&mut pool.balance_x, amount_out);

        coin::from_balance(payout, ctx)
    }

    // --- View Functions ---
    public fun get_reserves<X, Y>(pool: &Pool<X, Y>): (u64, u64) {
        (balance::value(&pool.balance_x), balance::value(&pool.balance_y))
    }
}
