#[test_only]
module origin::integration_tests {
    use sui::test_scenario::{Self as ts};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self};
    use std::string::{Self, String};
    
    use origin::marketplace::{Self, Marketplace};
    use origin::employer::{Self};
    use origin::candidate::{Self};
    use origin::listing::{Self, Listing};
    use origin::escrow::{Self, Escrow};

    // Addresses
    const ADMIN: address = @0xAD;
    const FEE_COLLECTOR: address = @0xFEE;
    
    const EMPLOYER_1: address = @0xA1;
    const EMPLOYER_2: address = @0xA2;
    const EMPLOYER_3: address = @0xA3;
    
    const CANDIDATE_1: address = @0xB1;
    const CANDIDATE_2: address = @0xB2;
    const CANDIDATE_3: address = @0xB3;

    #[test]
    fun test_end_to_end_scenario() {
        let mut scenario = ts::begin(ADMIN);
        
        // 1. Setup Marketplace
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(100, FEE_COLLECTOR, ts::ctx(&mut scenario));
        };

        // 2. Create Employer Profiles
        let employers = vector[EMPLOYER_1, EMPLOYER_2, EMPLOYER_3];
        let mut i = 0;
        while (i < 3) {
            let emp = *vector::borrow(&employers, i);
            ts::next_tx(&mut scenario, emp);
            {
                employer::create_profile(
                    string::utf8(b"Emp Name"),
                    string::utf8(b"Bio"),
                    string::utf8(b"Loc"),
                    string::utf8(b"Web"),
                    string::utf8(b"Logo"),
                    string::utf8(b"TAX123"),
                    vector::empty(),
                    vector::empty(),
                    ts::ctx(&mut scenario)
                );
            };
            i = i + 1;
        };

        // 3. Create Candidate Profiles
        let candidates = vector[CANDIDATE_1, CANDIDATE_2, CANDIDATE_3];
        let mut j = 0;
        while (j < 3) {
            let cand = *vector::borrow(&candidates, j);
            ts::next_tx(&mut scenario, cand);
            {
                candidate::create_profile(
                    string::utf8(b"Cand Name"),
                    string::utf8(b"Bio"),
                    vector::empty<String>(), // portfolio
                    vector::empty<String>(), // skills
                    string::utf8(b"Loc"),
                    vector::empty<String>(), // nationalities
                    string::utf8(b"USD"),
                    string::utf8(b"Pic"),
                    false, // loc priv
                    false, // nat priv
                    vector::empty<String>(), // contact
                    vector::empty<bool>(), // contact priv
                    vector::empty<String>(), // lang names
                    vector::empty<String>(), // lang profs
                    vector::empty<String>(), // edu inst
                    vector::empty<String>(), // edu courses
                    vector::empty<String>(), // edu degrees
                    vector::empty<String>(), // edu starts
                    vector::empty<String>(), // edu ends
                    vector::empty<String>(), // cert names
                    vector::empty<String>(), // cert links
                    vector::empty<u64>(), // cert dates
                    100, // hourly
                    0, false, 0, false, // rates
                    vector::empty<u8>(), vector::empty<u8>(), vector::empty<u8>(), // hashes
                    ts::ctx(&mut scenario)
                );
            };
            j = j + 1;
        };

        // 4. Employers Post Jobs
        // Job 1 by Employer 1
        ts::next_tx(&mut scenario, EMPLOYER_1);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            listing::create_job(
                &mut marketplace,
                b"Build Website",
                b"Desc",
                b"Details",
                vector::empty(), // skill names
                vector::empty(), // skill exps
                vector::empty(), // tags
                1000, // Budget
                0, // Fixed
                7, 2, // 7 Days
                b"Remote",
                false,
                b"Emp Co",
                b"Logo",
                b"English",
                1000000000, // Deadline
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(marketplace);
        };
        
        // Job 2 by Employer 2
        ts::next_tx(&mut scenario, EMPLOYER_2);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            listing::create_job(&mut marketplace, b"Job 2", b"D", b"D", vector::empty(), vector::empty(), vector::empty(), 2000, 0, 1, 1, b"Loc", false, b"Co", b"Url", b"Eng", 9999, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(marketplace);
        };

        // Job 3 by Employer 3
        ts::next_tx(&mut scenario, EMPLOYER_3);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            listing::create_job(&mut marketplace, b"Job 3", b"D", b"D", vector::empty(), vector::empty(), vector::empty(), 3000, 0, 1, 1, b"Loc", false, b"Co", b"Url", b"Eng", 9999, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(marketplace);
        };

        // 5. Candidate Apply (Job 4 Flow) - we create a fresh job to be sure
        ts::next_tx(&mut scenario, EMPLOYER_1);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            listing::create_job(&mut marketplace, b"Job 4 Dispute", b"D", b"D", vector::empty(), vector::empty(), vector::empty(), 5000, 0, 1, 1, b"Loc", false, b"Co", b"Url", b"Eng", 9999, &clock, ts::ctx(&mut scenario));
            clock::destroy_for_testing(clock);
            ts::return_shared(marketplace);
        };

        // Apply to Job 4 (Most recent)
        ts::next_tx(&mut scenario, CANDIDATE_1);
        {
            let mut job = ts::take_shared<Listing>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            // Verify it's Job 4
            assert!(listing::get_poster(&job) == EMPLOYER_1, 0); 
            
            listing::apply_to_job(
                &mut job,
                b"Proposal",
                5000, // Price
                7, // Est delivery
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(job);
        };

        // 6. Select Freelancer
        ts::next_tx(&mut scenario, EMPLOYER_1);
        {
            let mut job = ts::take_shared<Listing>(&scenario);
            listing::select_freelancer(&mut job, CANDIDATE_1, ts::ctx(&mut scenario));
            ts::return_shared(job);
        };

        // 7. Create Escrow for Job 4
        ts::next_tx(&mut scenario, EMPLOYER_1);
        {
             let mut marketplace = ts::take_shared<Marketplace>(&scenario);
             // Mint coins for escrow
             let coin = coin::mint_for_testing<SUI>(5000, ts::ctx(&mut scenario));
             
             let contract = TestServiceContract { id: object::new(ts::ctx(&mut scenario)) };
             
             let clock = clock::create_for_testing(ts::ctx(&mut scenario));
             
             escrow::create_escrow<TestServiceContract>(
                &mut marketplace,
                &contract,
                EMPLOYER_1, // Employer addr
                CANDIDATE_1, // Freelancer addr
                coin,
                &clock,
                ts::ctx(&mut scenario)
             );
             
             clock::destroy_for_testing(clock);
             transfer::public_transfer(contract, EMPLOYER_1); // Keep contract alive
             ts::return_shared(marketplace);
        };

        // 8. Dispute & Resolution (Split)
        ts::next_tx(&mut scenario, EMPLOYER_1);
        {
            let mut escrow = ts::take_shared<Escrow>(&scenario);
            escrow::initiate_dispute(&mut escrow, ts::ctx(&mut scenario));
            ts::return_shared(escrow);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut escrow = ts::take_shared<Escrow>(&scenario);
            let marketplace = ts::take_shared<Marketplace>(&scenario);
            
            // Resolve 50/50
            escrow::resolve_dispute_split(&mut escrow, &marketplace, 5000, ts::ctx(&mut scenario));
            
            ts::return_shared(escrow);
            ts::return_shared(marketplace);
        };
        
        // 9. Assertions (Balances)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let fl_coin = ts::take_from_address<Coin<SUI>>(&scenario, CANDIDATE_1);
             // 5000 total. 1% fee = 50. Remainder = 4950.
             // Split 50% = 2475.
            assert!(coin::value(&fl_coin) == 2475, 1);
            ts::return_to_address(CANDIDATE_1, fl_coin);
        };

        ts::end(scenario);
    }

    public struct TestServiceContract has key, store {
        id: UID
    }
}
