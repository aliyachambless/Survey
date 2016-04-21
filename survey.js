(function() {
  // Edit these two values to personalize.
  var air_table_app_id = 'appL60O2VDIQQWHUv';
  var air_table_api_key = 'keyw3cdZFi8RFVwH8';

  // !
  // Do not touch below
  // !

  if (!$) {
    throw 'jQuery not found';
  }

  var air_table_host = 'https://api.airtable.com/v0/';
  var Survey = window.Survey = {};

  Survey.table_url = function(table) {
    return air_table_host + air_table_app_id + '/' + table + '?api_key=' + air_table_api_key;
  };

  Survey.fetch_table = function(table, cb) {
    $.get(Survey.table_url(table), function(response) {
      cb(response['records']);
    });
  };

  Survey.fetch_surveys = function(cb) {
    Survey.fetch_table('surveys', cb);
  }

  Survey.fetch_surveys_with_votes = function(cb) {
    Survey.fetch_surveys(function(surveys) {
      Survey.load_votes(function(votes) {
        var processed = surveys.map(function(survey) {
          // Make object shallower
          survey = survey.fields;
          survey.options = survey.options.split(', '); // Fetch

          // Get votes for survey
          var survey_votes = votes[survey.id];

          // If there's no votes, don't bother.
          if (!survey_votes) {
            return survey;
          }

          // Turn options into objects that have a `name` and `votes` properties.
          survey.options = survey.options.map(function(option) {
            return {
              name: option,
              votes: survey_votes[option] || 0
            };
          });

          return survey;
        });

        cb(processed);
      });
    });
  }

  Survey.cast_vote = function(survey_id, vote, cb) {
    var data = {
      fields: {
        survey_id: Number(survey_id),
        vote: String(vote)
      }
    };

    $.ajax({
      url: Survey.table_url('votes'),
      dataType: "json",
      contentType: 'application/json',
      type: "POST",
      data: JSON.stringify(data),
      complete: cb
    });
  };

  Survey.load_votes = function(cb) {
    Survey.fetch_table('votes', function(votes) {
      // Tally up votes
      Survey.tally_votes(votes, cb);
    });
  };

  Survey.tally_votes = function(votes, cb) {
    var tally = {};

    for (var j = 0; j < votes.length; j++) {
      var survey_id = votes[j]['fields']['survey_id'];
      var vote_value = votes[j]['fields']['vote'];

      // Initialize survey
      if (!tally[survey_id]) { tally[survey_id] = {} }
      // Initialize value
      if (!tally[survey_id][vote_value]) {
        tally[survey_id][vote_value] = 0;
      }

      // Count vote
      tally[survey_id][vote_value] += 1;
    }

    cb(tally);
  }
})();
