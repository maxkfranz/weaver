## Event object

Events passed to handler callbacks are similar to [jQuery event objects](http://api.jquery.com/category/events/event-object/) in that they mimic the API of native event objects.

Fields:

 * `type` : the event type string (e.g. `'stop'`)
 * `namespace` : the event namespace string (e.g. `'foo'` for `'foo.tap'`)
 * `data` : additional data object passed by `.trigger()`
 * `timeStamp` : Unix epoch time of event


## Thread events

 * `run` : when a thread starts a run
 * `ran` : when a thread ends a run
 * `stop` : when a thread is stopped (i.e. terminated and no longer usable)
 * `message` : when a thread receives a message
