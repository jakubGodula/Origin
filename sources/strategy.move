module origin::strategy {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::bag::{Self, Bag};
    use std::string::{String};
    use std::type_name::{Self, TypeName};
    
    use origin::dex::{Self, Pool};

    // --- Errors ---
    const ENotOwner: u64 = 0;
    const EInsufficientFunds: u64 = 1;
    const EInvalidAsset: u64 = 2;

    // --- Structs ---

    /// NFT representing ownership/admin rights of the Strategy.
    public struct StrategyCap has key, store {
        id: UID,
        strategy_id: ID,
    }

    /// The Vault holding mixed assets in a Bag.
    public struct StrategyVault has key {
        id: UID,
        name: String,
        assets: Bag, // Map<TypeName, Balance<T>>
        manager: address,
    }

    // --- Events ---
    public struct StrategyCreated has copy, drop {
        id: ID,
        manager: address,
        name: String,
    }

    public struct AssetDeposited has copy, drop {
        strategy_id: ID,
        asset_type: String,
        amount: u64,
    }

    public struct TradeExecuted has copy, drop {
        strategy_id: ID,
        token_in: String,
        amount_in: u64,
        token_out: String,
        amount_out: u64,
    }

    // --- Functions ---

    public entry fun create_strategy(
        name: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let id_u = object::new(ctx);
        let strategy_id = object::uid_to_inner(&id_u);

        let vault = StrategyVault {
            id: id_u,
            name,
            assets: bag::new(ctx),
            manager: sender,
        };

        let cap = StrategyCap {
            id: object::new(ctx),
            strategy_id,
        };

        transfer::share_object(vault);
        transfer::public_transfer(cap, sender);

        sui::event::emit(StrategyCreated {
            id: strategy_id,
            manager: sender,
            name,
        });
    }

    /// Deposit any coin into the vault
    public entry fun deposit<T>(
        vault: &mut StrategyVault,
        payment: Coin<T>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        let type_key = type_name::get<T>();
        
        if (!bag::contains(&vault.assets, type_key)) {
            bag::add(&mut vault.assets, type_key, coin::into_balance(payment));
        } else {
            let bal = bag::borrow_mut<TypeName, Balance<T>>(&mut vault.assets, type_key);
            balance::join(bal, coin::into_balance(payment));
        };

        sui::event::emit(AssetDeposited {
            strategy_id: object::id(vault),
            asset_type: std::string::from_ascii(type_name::into_string(type_key)),
            amount,
        });
    }

    /// Manager executes Swap X -> Y
    public fun execute_swap_x_to_y<X, Y>(
        _cap: &StrategyCap, // Proof of authority
        vault: &mut StrategyVault,
        pool: &mut Pool<X, Y>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(object::id(vault) == _cap.strategy_id, ENotOwner);
        
        // 1. Borrow X from Bag
        let type_x = type_name::get<X>();
        assert!(bag::contains(&vault.assets, type_x), EInsufficientFunds);
        
        let bal_x = bag::borrow_mut<TypeName, Balance<X>>(&mut vault.assets, type_x);
        assert!(balance::value(bal_x) >= amount, EInsufficientFunds);

        let input = coin::from_balance(balance::split(bal_x, amount), ctx);

        // 2. Perform Swap
        let output_coin = dex::swap_x_to_y(pool, input, ctx);
        let amount_out = coin::value(&output_coin);

        // 3. Put Y into Bag
        let type_y = type_name::get<Y>();
        if (!bag::contains(&vault.assets, type_y)) {
            bag::add(&mut vault.assets, type_y, coin::into_balance(output_coin));
        } else {
            let bal_y = bag::borrow_mut<TypeName, Balance<Y>>(&mut vault.assets, type_y);
            balance::join(bal_y, coin::into_balance(output_coin));
        };

        sui::event::emit(TradeExecuted {
            strategy_id: object::id(vault),
            token_in: std::string::from_ascii(type_name::into_string(type_x)),
            amount_in: amount,
            token_out: std::string::from_ascii(type_name::into_string(type_y)),
            amount_out: amount_out,
        });
    }
}
