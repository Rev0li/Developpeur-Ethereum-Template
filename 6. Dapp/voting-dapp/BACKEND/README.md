Les tests sont organisés en plusieurs groupes afin de couvrir les différentes fonctionnalités du contrat "Voting".
J'ai un test de 100% sur l'ensemble du test.

Pour les doc
npm install hardhat-docgen

### REGISTRATION

Ce groupe de tests concerne les fonctions `addVoter` et `getVoter`.

- `should return Caller is not the owner`: Vérifie si un appelant autre que le propriétaire ne peut pas ajouter un électeur.
- `should return Voters registration is not open yet`: Vérifie que l'inscription des électeurs n'est pas encore ouverte.
- `should return Already registered`: Vérifie qu'un électeur est déjà inscrit.
- `should emit a new struct in a mapping with address Voters`: Vérifie si un événement est émis lors de l'ajout d'un électeur.
- `should return struct of Voter with getVoters`: Vérifie si les informations d'un électeur sont correctement récupérées.
- `should return You're not a voter`: Vérifie si un électeur non inscrit ne peut pas récupérer ses informations.

### PROPOSAL

Ce groupe de tests concerne les fonctions `addProposal` et `getOneProposal`.

- `should return You're not a voter`: Vérifie qu'un non-votant ne peut pas ajouter de proposition.
- `should return Proposals are not allowed yet`: Vérifie si les propositions ne sont pas encore autorisées.
- `should return Vous ne pouvez pas ne rien proposer`: Vérifie qu'une proposition vide n'est pas autorisée.
- `should add and get a proposal equal`: Vérifie qu'une proposition est correctement ajoutée et récupérée.
- `should emit in proposalsArray a voter proposal`: Vérifie qu'un événement est émis lors de l'ajout d'une proposition.
- `should return You're not a voter`: Vérifie si un non-votant ne peut pas récupérer une proposition.

### VOTE

Ce groupe de tests concerne la fonction `setVote`.

- `should return You're not a voter`: Vérifie qu'un non-votant ne peut pas voter.
- `should return Voting session haven't started yet`: Vérifie que la session de vote n'a pas encore commencé.
- `should return You have already voted`: Vérifie si un électeur ne peut pas voter plusieurs fois.
- `should return Proposal not found`: Vérifie qu'une proposition invalide n'est pas autorisée.
- `should voteCount`: Vérifie que le décompte des votes est correct.
- `should recup hasVoted true and votedProposal Id and voteCount`: Vérifie que les informations relatives au vote d'un électeur ont été correctement récupérées.
- `should emit address and voterProposalId in proposalsArray and in mapping` : Vérifie si l'adresse du votant et l'identifiant de la proposition votée sont correctement émis dans le tableau proposalsArray et dans la structure de données de mappage.

### TALLY VOTE

- `should return Ownable: caller is not the owner `: Vérifie si une exception est renvoyée lorsque l'appelant n'est pas le propriétaire du contrat. Cette exception indique que la fonction n'a été appelée que par le propriétaire autorisé.
- `require Voting session ended` : Vérifie si une exception est renvoyée lorsque l'état actuel n'est pas "voting session ended". Cette exception indique que la fonction tallyVotes ne peut être appelée que lorsque la session de vote est terminée.
- `emit WorkflowStatusChange` : Vérifie si un événement "WorkflowStatusChange" est émis lorsque la session de vote est terminée et que tallyVotes est appelée avec succès. Cet événement contient les arguments correspondant aux statuts 4 et 5, indiquant la transition du statut de "voting session ended" au statut suivant.

### STATE

#### startProposalsRegistering

Ce groupe de tests concerne la fonction startProposalsRegistering.

- should `return Ownable: caller is not the owner` : Vérifie si une exception est renvoyée lorsque l'appelant n'est pas le propriétaire du contrat. Cette exception indique que la fonction n'a été appelée que par le propriétaire autorisé.
- should `return Registering proposals cant be started now` : Vérifie si une exception est renvoyée lorsque la phase d'enregistrement des propositions est déjà en cours ou a déjà été terminée. Cette exception indique que la fonction startProposalsRegistering ne peut être appelée que lorsque la phase précédente a été terminée.
- should `emit WorkflowStatusChange 0 to 1` : Vérifie si un événement "WorkflowStatusChange" est émis lorsqu'un nouvel enregistrement de propositions est démarré avec succès. Cet événement contient les arguments correspondant aux statuts 0 et 1, indiquant la transition du statut initial au statut suivant.

#### endProposalsRegistering

Ce groupe de tests concerne la fonction endProposalsRegistering.

- should `return Ownable: caller is not the owner` : Vérifie si une exception est renvoyée lorsque l'appelant n'est pas le propriétaire du contrat. Cette exception indique que la fonction n'a été appelée que par le propriétaire autorisé.
- should `return Registering proposals havent started yet` : Vérifie si une exception est renvoyée lorsque la phase d'enregistrement des propositions n'a pas encore commencé. Cette exception indique que la fonction endProposalsRegistering ne peut être appelée que lorsque la phase précédente a été démarrée.
- should `emit WorkflowStatusChange 1 to 2` : Vérifie si un événement "WorkflowStatusChange" est émis lorsque la phase d'enregistrement des propositions est terminée avec succès. Cet événement contient les arguments correspondant aux statuts 1 et 2, indiquant la transition du statut précédent au statut suivant.

#### startVotingSession

Ce groupe de tests concerne la fonction startVotingSession.

- should `return Ownable: caller is not the owner` : Vérifie si une exception est renvoyée lorsque l'appelant n'est pas le propriétaire du contrat. Cette exception indique que la fonction n'a été appelée que par le propriétaire autorisé.
- should `return Registering proposals phase is not finished` : Vérifie si une exception est renvoyée lorsque la phase d'enregistrement des propositions n'a pas encore été terminée. Cette exception indique que la fonction startVotingSession ne peut être appelée que lorsque la phase précédente a été terminée.
- should `emit WorkflowStatusChange 2 to 3 `: Vérifie si un événement "WorkflowStatusChange" est émis lorsque la session de vote est démarrée avec succès. Cet événement contient les arguments correspondant aux statuts 2 et 3, indiquant la transition du statut précédent au statut suivant.

#### endVotingSession

Ce groupe de tests concerne la fonction endVotingSession.

- `should return Ownable: caller is not the owner` : Vérifie si une exception est renvoyée lorsque l'appelant n'est pas le propriétaire

### GENESIS

Ce groupe de tests concerne la fonction getGenesis.

-`should return Genesis` : Vérifie si l'adresse du contrat d'origine est correctement renvoyée.
