#!/bin/bash 
newman run ./Sample.postman_collection.json \
  -r digy4 \
  --reporter-digy4-suppressExitCode true \
  --environment ./digyrunnerConfig.json
