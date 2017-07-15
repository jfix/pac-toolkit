# Dossier Redmine

## TODO

* on submit create issue and subissues in Redmine
* validate form before submission
* Bonus: read config file for form generation
* ~~Bonus: get title and other stuff from Kappa v3~~
* ~~HTML form (nicer look)~~
* ~~different subtasks depending on selected publication type~~


## INFO

```text
 POST http://[redmine-server]:8080/redmine/issues.json

 X-Redmine-API-Key: ...
 Content-type: application/json
```

Request body:

```json
 {
	"issue": {
		"project_id": 9,
		"subject": "Hello, World!!!",
		"priority_id": 6,
		"description": "here's some blah blah blah",
		"watcher_user_ids": [101, 4],
		"due_date": "2018-01-01",
		"parent_issue_id": 10574
	}
}
```

Response:

```json
{
    "issue": {
        "id": 10575,
        "project": {
            "id": 9,
            "name": " project name...."
        },
        "tracker": {
            "id": 3,
            "name": "Support"
        },
        "status": {
            "id": 1,
            "name": "New"
        },
        "priority": {
            "id": 6,
            "name": "Urgent"
        },
        "author": {
            "id": 4,
            "name": "Jakob FIX"
        },
        "parent": {
            "id": 10574
        },
        "subject": "Hello, World!!!",
        "description": "here's some blah blah blah",
        "start_date": "2017-07-13",
        "due_date": "2018-01-01",
        "done_ratio": 0,
        "created_on": "2017-07-13T14:54:57Z",
        "updated_on": "2017-07-13T14:54:57Z"
    }
}
```
