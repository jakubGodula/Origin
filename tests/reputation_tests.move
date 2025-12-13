#[test_only]
module origin::reputation_tests {
    use sui::test_scenario::{Self as ts};
    use std::string::{Self, String};
    use origin::reputation::{Self, ReputationProfile};

    const USER1: address = @0xA1;
    const EMPLOYER: address = @0xB1;

    #[test]
    fun test_rate_skills() {
        let mut scenario = ts::begin(USER1);

        // 1. Create Profile
        ts::next_tx(&mut scenario, USER1);
        {
            reputation::create_profile(ts::ctx(&mut scenario));
        };

        // 2. Rate Skills
        ts::next_tx(&mut scenario, EMPLOYER);
        {
            let mut profile = ts::take_shared<ReputationProfile>(&scenario);
            
            let skills = vector[string::utf8(b"Rust"), string::utf8(b"Move")];
            let scores = vector[5, 4]; // 5/5 for Rust, 4/5 for Move

            reputation::rate_skills(
                &mut profile,
                skills,
                scores,
                ts::ctx(&mut scenario)
            );

            // Add another rating for Move to test average
            let more_skills = vector[string::utf8(b"Move")];
            let more_scores = vector[2]; // 2/5 for Move. Average should be (4+2)/2 = 3.
            
            reputation::rate_skills(
                &mut profile,
                more_skills,
                more_scores,
                ts::ctx(&mut scenario)
            );

            // Verify
            assert!(reputation::get_skill_average(&profile, string::utf8(b"Rust")) == 500, 0); // 5.00 * 100? Logic in contract is (score * 100) / count. So 5*100/1 = 500.
            assert!(reputation::get_skill_average(&profile, string::utf8(b"Move")) == 300, 1); // (4+2)*100 / 2 = 300.

            ts::return_shared(profile);
        };

        ts::end(scenario);
    }
}
