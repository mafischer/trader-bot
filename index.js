const credentials = require("./credentials");
const Robinhood = require('robinhood')(credentials, function(){

    Robinhood.quote_data('TSLA', function(error, response, body) {
        if (error) {
            console.error(error);
            process.exit(1);
        }
        console.log(body);
    });

    Robinhood.investment_profile(function(err, response, body){
        if(err){
            console.error(err);
        }else{
            console.log("investment_profile");
            console.log(body);
                //    { annual_income: '25000_39999',
                //      investment_experience: 'no_investment_exp',
                //      updated_at: '2015-06-24T17:14:53.593009Z',
                //      risk_tolerance: 'low_risk_tolerance',
                //      total_net_worth: '0_24999',
                //      liquidity_needs: 'very_important_liq_need',
                //      investment_objective: 'income_invest_obj',
                //      source_of_funds: 'savings_personal_income',
                //      user: 'https://api.robinhood.com/user/',
                //      suitability_verified: true,
                //      tax_bracket: '',
                //      time_horizon: 'short_time_horizon',
                //      liquid_net_worth: '0_24999' }

        }
    })
});
