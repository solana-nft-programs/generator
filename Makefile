.PHONY: install test-keys build start test clean-test-keys stop

TEST_KEY := $(shell solana-keygen pubkey ./tests/test-key.json)

all: install test-keys build start test clean-test-keys stop

install:
	yarn install

test-keys:
	anchor build
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/stkBL96RZkjY5ine4TvPihGqW8UHJfch2cokjAPzV8i/$$(solana-keygen pubkey ./target/deploy/cardinal_stake_pool-keypair.json)/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/rwdNPNPS6zNvtF6FMvaxPRjzu2eC51mXaDT9rmWsojp/$$(solana-keygen pubkey ./target/deploy/cardinal_reward_distributor-keypair.json)/g" {} +
	anchor build

build:
	anchor build
	yarn idl:generate

start:
	solana-test-validator --url https://api.devnet.solana.com \
		--clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT \
		--clone mgr99QFMYByTqGPWmNqunV7vBLmWWXdSrHUfV8Jf3JM --clone ojLGErfqghuAqpJXE1dguXF7kKfvketCEeah8ig6GU3 \
		--bpf-program ./target/deploy/cardinal_stake_pool-keypair.json ./target/deploy/cardinal_stake_pool.so \
		--bpf-program ./target/deploy/cardinal_reward_distributor-keypair.json ./target/deploy/cardinal_reward_distributor.so \
		--reset --quiet & echo $$! > validator.PID
	sleep 5
	solana-keygen pubkey ./tests/test-key.json
	solana airdrop 1000 $(TEST_KEY) --url http://localhost:8899

deploy:
	anchor deploy --provider.cluster localnet

test:
	anchor test --skip-local-validator --skip-build --skip-deploy --provider.cluster localnet

clean-test-keys:
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey ./target/deploy/cardinal_stake_pool-keypair.json)/stkBL96RZkjY5ine4TvPihGqW8UHJfch2cokjAPzV8i/g" {} +
	LC_ALL=C find programs src -type f -exec sed -i '' -e "s/$$(solana-keygen pubkey ./target/deploy/cardinal_reward_distributor-keypair.json)/rwdNPNPS6zNvtF6FMvaxPRjzu2eC51mXaDT9rmWsojp/g" {} +

stop: validator.PID
	kill `cat $<` && rm $<