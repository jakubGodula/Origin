#[test_only]
module origin::candidate_tests {
    use sui::test_scenario::{Self as ts};
    use std::string;
    use origin::candidate::{Self, CandidateProfile};

    // Test addresses
    const USER1: address = @0xA1;

    #[test]
    fun test_create_profile() {
        let mut scenario = ts::begin(USER1);

        // Create profile
        ts::next_tx(&mut scenario, USER1);
        {
            let skills = vector[string::utf8(b"Rust"), string::utf8(b"Move")];
            let contact_info_values = vector[string::utf8(b"email@example.com")];
            let contact_info_private = vector[false];

            candidate::create_profile(
                string::utf8(b"Alice"),
                string::utf8(b"Developer"),
                vector[string::utf8(b"https://alice.dev")], // portfolio
                skills,
                string::utf8(b"Wonderland"),
                vector[string::utf8(b"US")], // nationalities
                string::utf8(b"USD"),
                string::utf8(b"https://alice.dev/pic.jpg"),
                false,
                false,
                contact_info_values,
                contact_info_private,
                vector::empty<string::String>(), // lang names
                vector::empty<string::String>(), // lang profs
                vector::empty<string::String>(), // edu inst
                vector::empty<string::String>(), // edu courses
                vector::empty<string::String>(), // edu degrees
                vector::empty<string::String>(), // edu starts
                vector::empty<string::String>(), // edu ends
                vector::empty<string::String>(), // cert names
                vector::empty<string::String>(), // cert links
                vector::empty<u64>(), // cert dates
                100, // hourly
                0, false, 0, false, // rates
                vector::empty<u8>(), vector::empty<u8>(), vector::empty<u8>(), // hashes
                ts::ctx(&mut scenario)
            );
        };

        // Verify profile created and status is ACTIVE (0)
        ts::next_tx(&mut scenario, USER1);
        {
            let profile = ts::take_from_sender<CandidateProfile>(&scenario);
            assert!(candidate::get_name(&profile) == string::utf8(b"Alice"), 0);
            assert!(candidate::get_status(&profile) == 0, 1); // 0 = ACTIVE
            ts::return_to_sender(&scenario, profile);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_clone_profile() {
        let mut scenario = ts::begin(USER1);

        // Create initial profile
        ts::next_tx(&mut scenario, USER1);
        {
            let skills = vector[string::utf8(b"Rust")];
            let contact_info_values = vector::empty();
            let contact_info_private = vector::empty();

            candidate::create_profile(
                string::utf8(b"Bob"),
                string::utf8(b"Builder"),
                vector[string::utf8(b"")], // portfolio
                skills,
                string::utf8(b""), // location
                vector[string::utf8(b"")], // nationalities
                string::utf8(b""),
                string::utf8(b""),
                false,
                false,
                contact_info_values,
                contact_info_private,
                vector::empty<string::String>(), // lang names
                vector::empty<string::String>(), // lang profs
                vector::empty<string::String>(), // edu inst
                vector::empty<string::String>(), // edu courses
                vector::empty<string::String>(), // edu degrees
                vector::empty<string::String>(), // edu starts
                vector::empty<string::String>(), // edu ends
                vector::empty<string::String>(), // cert names
                vector::empty<string::String>(), // cert links
                vector::empty<u64>(), // cert dates
                50, // hourly
                0, false, 0, false, // rates
                vector::empty<u8>(), vector::empty<u8>(), vector::empty<u8>(), // hashes
                ts::ctx(&mut scenario)
            );
        };

        // Clone profile
        ts::next_tx(&mut scenario, USER1);
        {
            let profile = ts::take_from_sender<CandidateProfile>(&scenario);
            candidate::clone_profile(&profile, ts::ctx(&mut scenario));
            ts::return_to_sender(&scenario, profile);
        };

        // Verify cloned profile exists and status is MODIFIED (1)
        ts::next_tx(&mut scenario, USER1);
        {
            // Should have 2 profiles now.
            // Note: take_from_sender takes the most recent one usually, or we can iterate.
            // Since we returned the first one, it's back in sender's inventory.
            // The cloned one is also in sender's inventory.
            // We need to check if we can find one with status MODIFIED.

            // In test_scenario, take_from_sender takes an object.
            // Let's try to take both.
            let profile1 = ts::take_from_sender<CandidateProfile>(&scenario);
            let profile2 = ts::take_from_sender<CandidateProfile>(&scenario);

            let status1 = candidate::get_status(&profile1);
            let status2 = candidate::get_status(&profile2);

            // One should be 0, one should be 1
            assert!(status1 != status2, 2);
            assert!((status1 == 0 && status2 == 1) || (status1 == 1 && status2 == 0), 3);

            // Verify data is copied (name should be Bob for both)
            assert!(candidate::get_name(&profile1) == string::utf8(b"Bob"), 4);
            assert!(candidate::get_name(&profile2) == string::utf8(b"Bob"), 5);

            ts::return_to_sender(&scenario, profile1);
            ts::return_to_sender(&scenario, profile2);
        };

        ts::end(scenario);
    }
}
