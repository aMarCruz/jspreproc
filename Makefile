
MAKECC = $(TRAVIS_BRANCH) $(TRAVIS_NODE_VERSION)

cover:
	@ istanbul cover spec/run.js

sendc:
ifeq ($(MAKECC),master 4.2)
	@ npm install codeclimate-test-reporter
	@ codeclimate-test-reporter < coverage/lcov.info
else
	@ echo Will send in $(MAKECC)
endif

debug:
	@ node-debug spec/run.js

lint:
	@ eslint **/*.js
	# Done.

.PHONY: sendc cover lint debug
