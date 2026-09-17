// Elementos Globais
const tournamentSelect = document.getElementById('tournament-select');
const seasonInput = document.getElementById('season-input');
const addBtn = document.getElementById('add-btn');
const notesContainer = document.getElementById('notes-container');
const currentHistoryTitle = document.getElementById('current-history-title');
const formSectionTitle = document.getElementById('form-section-title');
const titlesGalleryContainer = document.getElementById('titles-gallery-container');
const historySeasonSelect = document.getElementById('history-season');

const players = ['nikolas', 'fabricio', 'marcel', 'joao'];
let selectedTournamentFilter = 'Brasileirão';
let selectedSeasonFilter = 'all'; // 'all' ou um ano específico

document.addEventListener('DOMContentLoaded', () => {
    handleTournamentChange();
    refreshSeasonOptions();
    renderNotes();
    calculateLeaderboard();
    renderTitlesGallery();
});

// Controla a mudança do campeonato
window.handleTournamentChange = function () {
    const isBrasileirao = tournamentSelect.value === 'Brasileirão';

    formSectionTitle.innerText = isBrasileirao
        ? 'Resultados por Jogador (Brasileirão)'
        : 'Resultados por Jogador (Fases de Copa)';

    players.forEach(player => {
        const ptsInput = document.getElementById(`pts-${player}`);
        const playerRow = document.getElementById(`row-${player}`);
        const rankSelect = document.getElementById(`rank-${player}`);

        if (!ptsInput || !playerRow || !rankSelect) return;

        if (isBrasileirao) {
            ptsInput.style.display = 'block';
            playerRow.classList.remove('no-points');
            buildBrasileiraoOptions(rankSelect);
        } else {
            ptsInput.style.display = 'none';
            ptsInput.value = '';
            playerRow.classList.add('no-points');
            buildCupOptions(rankSelect);
        }
    });
};

// Opções do Brasileirão
function buildBrasileiraoOptions(selectElement) {
    let optionsHtml = '<option value="">Posição...</option>';
    for (let i = 1; i <= 20; i++) {
        optionsHtml += `<option value="${i}º">${i}º Lugar</option>`;
    }
    selectElement.innerHTML = optionsHtml;
}

// Opções das Copas
function buildCupOptions(selectElement) {
    selectElement.innerHTML = `
        <option value="">Fase alcançada...</option>
        <option value="Campeão">🏆 Campeão</option>
        <option value="Vice">🥈 Vice</option>
        <option value="Semifinal">Semifinal</option>
        <option value="Quartas de Final">Quartas de Final</option>
        <option value="Oitavas de Final">Oitavas de Final</option>
        <option value="Play-offs">Play-offs</option>
        <option value="Fase de Grupos">Fase de Grupos</option>
        <option value="Não participou">❌ Não participou</option>
    `;
}

// Troca de abas
window.switchTab = function (tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const tab = document.getElementById(`tab-${tabName}`);
    const content = document.getElementById(`content-${tabName}`);

    if (tab) tab.classList.add('active');
    if (content) content.classList.add('active');

    if (tabName === 'history') {
        refreshSeasonOptions();
        renderNotes();
    }

    if (tabName === 'titles') {
        renderTitlesGallery();
    }
};

// Filtro por campeonato
window.filterByTournament = function (tournamentName) {
    selectedTournamentFilter = tournamentName;

    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        if (
            btn.innerText === tournamentName ||
            (tournamentName === 'Outro' && btn.innerText === 'Outros')
        ) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    refreshSeasonOptions();
    updateHistoryTitle();
    renderNotes();
};

// Filtro por temporada
window.filterBySeason = function () {
    selectedSeasonFilter = historySeasonSelect.value;
    updateHistoryTitle();
    renderNotes();
};

// Atualiza o título do histórico
function updateHistoryTitle() {
    const seasonLabel = selectedSeasonFilter === 'all'
        ? 'Todas as Temporadas'
        : `Temporada ${selectedSeasonFilter}`;

    currentHistoryTitle.innerText =
        `Histórico: ${selectedTournamentFilter} — ${seasonLabel}`;
}

// Popula o select de temporadas com base no histórico salvo
function refreshSeasonOptions() {
    if (!historySeasonSelect) return;

    const history = getHistoryFromStorage();

    // Pega temporadas únicas do campeonato selecionado
    const seasons = [
        ...new Set(
            history
                .filter(r => r.tournament === selectedTournamentFilter)
                .map(r => r.season)
                .filter(Boolean)
        )
    ].sort((a, b) => Number(b) - Number(a)); // mais recentes primeiro

    // Mantém a seleção atual se ainda existir
    const current = historySeasonSelect.value;
    historySeasonSelect.innerHTML = '<option value="all">Todas as temporadas</option>';

    seasons.forEach(season => {
        const opt = document.createElement('option');
        opt.value = season;
        opt.textContent = season;
        historySeasonSelect.appendChild(opt);
    });

    // Restaura ou reseta
    if (seasons.includes(current)) {
        historySeasonSelect.value = current;
        selectedSeasonFilter = current;
    } else {
        historySeasonSelect.value = 'all';
        selectedSeasonFilter = 'all';
    }
}

// Adicionar rodada
addBtn.addEventListener('click', () => {
    const tournament = tournamentSelect.value;
    const season = seasonInput.value.trim();

    if (!tournament) {
        alert('Selecione um campeonato.');
        return;
    }

    if (!season) {
        alert('Informe a temporada (ex: 2026).');
        seasonInput.focus();
        return;
    }

    // Pede confirmação se já existir rodada igual (mesmo campeonato+temporada)
    const history = getHistoryFromStorage();
    const sameRound = history.filter(
        r => r.tournament === tournament && r.season === season
    );

    const currentRound = {
        tournament: tournament,
        season: season,
        scores: {},
        timestamp: Date.now()
    };

    players.forEach(player => {
        const ptsInput = document.getElementById(`pts-${player}`);
        const rankSelect = document.getElementById(`rank-${player}`);

        currentRound.scores[player] = {
            pts: tournament === 'Brasileirão'
                ? (parseInt(ptsInput.value) || 0)
                : null,
            rank: rankSelect.value || 'N/A'
        };
    });

    saveRoundToStorage(currentRound);

    // Ajusta filtros para exibir exatamente o que foi cadastrado
    selectedTournamentFilter = tournament;
    selectedSeasonFilter = season;

    filterByTournament(tournament);

    // Força o select de temporada para a temporada cadastrada
    refreshSeasonOptions();
    if ([...historySeasonSelect.options].some(o => o.value === season)) {
        historySeasonSelect.value = season;
        selectedSeasonFilter = season;
    }

    updateHistoryTitle();

    calculateLeaderboard();
    renderTitlesGallery();

    clearForm();
    switchTab('history');
});

// Salva no LocalStorage
function saveRoundToStorage(round) {
    const history = getHistoryFromStorage();
    history.push(round);
    localStorage.setItem('footballRankedScoresV6', JSON.stringify(history));
}

// Recupera histórico
function getHistoryFromStorage() {
    const saved = localStorage.getItem('footballRankedScoresV6');
    if (!saved) return [];

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        return [];
    }
}

// Calcula pontuação e títulos
function calculateLeaderboard() {
    const history = getHistoryFromStorage();

    const totals = { nikolas: 0, fabricio: 0, marcel: 0, joao: 0 };
    const titles = { nikolas: 0, fabricio: 0, marcel: 0, joao: 0 };

    history.forEach(round => {
        players.forEach(player => {
            const score = round.scores[player];
            if (!score) return;

            if (round.tournament === 'Brasileirão' && typeof score.pts === 'number') {
                totals[player] += score.pts;
            }

            if (score.rank === '1º' || score.rank === 'Campeão') {
                titles[player]++;
            }
        });
    });

    players.forEach(player => {
        const totalElement = document.getElementById(`total-${player}`);
        const titlesElement = document.getElementById(`titles-${player}`);

        if (totalElement) totalElement.innerText = `${totals[player]} pts`;
        if (titlesElement) titlesElement.innerText = titles[player];
    });
}

// Peso das posições
function getRankWeight(rankStr, isBrasileirao) {
    if (!rankStr || rankStr === 'N/A' || rankStr === '') return 999;

    if (isBrasileirao) {
        return parseInt(rankStr.replace('º', '')) || 999;
    }

    const cupWeights = {
        'Campeão': 1,
        'Vice': 2,
        'Semifinal': 3,
        'Quartas de Final': 4,
        'Oitavas de Final': 5,
        'Play-offs': 6,
        'Fase de Grupos': 7
    };

    return cupWeights[rankStr] || 999;
}

// Renderiza histórico
function renderNotes() {
    notesContainer.innerHTML = '';

    const allHistory = getHistoryFromStorage();

    const isCurrentFilterBrasileirao =
        selectedTournamentFilter === 'Brasileirão';

    const filteredHistory = allHistory.filter(round => {
        const matchesTournament = round.tournament === selectedTournamentFilter;
        const matchesSeason = selectedSeasonFilter === 'all'
            || round.season === selectedSeasonFilter;
        return matchesTournament && matchesSeason;
    });

    if (filteredHistory.length === 0) {
        const seasonLabel = selectedSeasonFilter === 'all'
            ? ''
            : ` na temporada ${selectedSeasonFilter}`;

        notesContainer.innerHTML = `
            <p style="color:#64748b; text-align:center; padding:30px;">
                Nenhum registro para ${selectedTournamentFilter}${seasonLabel}.
            </p>
        `;
        return;
    }

    // Agrupa por temporada
    const bySeason = {};
    filteredHistory.forEach(round => {
        const season = round.season || 'Sem temporada';
        if (!bySeason[season]) bySeason[season] = [];
        bySeason[season].push(round);
    });

    // Ordena temporadas (mais recente primeiro)
    const seasons = Object.keys(bySeason).sort((a, b) => {
        if (a === 'Sem temporada') return 1;
        if (b === 'Sem temporada') return -1;
        return Number(b) - Number(a);
    });

    seasons.forEach(season => {
        // Cabeçalho da temporada (só mostra quando não está filtrando por uma)
        if (selectedSeasonFilter === 'all') {
            const seasonHeader = document.createElement('h3');
            seasonHeader.className = 'season-header';
            seasonHeader.innerText = `📅 Temporada ${season}`;
            notesContainer.appendChild(seasonHeader);
        }

        // Rodadas da temporada (mais recente primeiro)
        bySeason[season]
            .slice()
            .reverse()
            .forEach(round => {
                const noteItem = document.createElement('div');
                noteItem.classList.add('note-item');

                let orderedPlayers = players.map(playerKey => {
                    const data = round.scores[playerKey] || { pts: null, rank: 'N/A' };
                    const capitalizedName =
                        playerKey.charAt(0).toUpperCase() + playerKey.slice(1);

                    return {
                        name: capitalizedName,
                        pts: data.pts,
                        rank: data.rank,
                        weight: getRankWeight(data.rank, isCurrentFilterBrasileirao)
                    };
                });

                orderedPlayers.sort((a, b) => a.weight - b.weight);

                let playersHtml = '';
                orderedPlayers.forEach(player => {
                    const isWinner =
                        player.rank === 'Campeão' || player.rank === '1º';

                    playersHtml += `
                        <div class="score-tag-horizontal ${isWinner ? 'winner-cup' : ''}">
                            <div class="p-name">${player.name}</div>
                            ${player.pts !== null ? `<div class="p-pts">${player.pts} Pts</div>` : ''}
                            <div class="p-rank">
                                ${player.rank === 'N/A' ? 'Sem Reg.' : player.rank}
                            </div>
                        </div>
                    `;
                });

                const dateLabel = new Date(round.timestamp).toLocaleDateString('pt-BR');

                noteItem.innerHTML = `
                    <div class="note-header">
                        <span class="match-badge">
                            ${round.tournament} • ${round.season || '--'}
                        </span>
                        <span class="note-date">${dateLabel}</span>
                        <button class="delete-btn"
                            onclick="deleteRoundByTimestamp(${round.timestamp})">
                            Excluir
                        </button>
                    </div>
                    <div class="note-body-horizontal">
                        ${playersHtml}
                    </div>
                `;

                notesContainer.appendChild(noteItem);
            });
    });
}

// Galeria de títulos
function renderTitlesGallery() {
    titlesGalleryContainer.innerHTML = '';

    const history = getHistoryFromStorage();

    const playerTrophies = { nikolas: [], fabricio: [], marcel: [], joao: [] };

    history.forEach(round => {
        players.forEach(player => {
            const rank = round.scores[player]?.rank;
            if (rank === '1º' || rank === 'Campeão') {
                playerTrophies[player].push({
                    tournament: round.tournament,
                    season: round.season || '--'
                });
            }
        });
    });

    players.forEach(player => {
        const capitalizedName =
            player.charAt(0).toUpperCase() + player.slice(1);

        const trophies = playerTrophies[player];
        const card = document.createElement('div');
        card.className = 'note-item';
        card.style.background = '#1e293b';

        if (trophies.length === 0) {
            card.innerHTML = `
                <div class="p-name" style="font-size:16px; color:#94a3b8;">
                    🥈 ${capitalizedName}
                </div>
                <p style="color:#64748b; font-size:13px; font-style:italic; margin-top:5px;">
                    Nenhum título conquistado ainda.
                </p>
            `;
        } else {
            // Agrupa por torneio+temporada
            const counts = {};
            trophies.forEach(t => {
                const key = `${t.tournament}|${t.season}`;
                counts[key] = (counts[key] || 0) + 1;
            });

            let trophiesListHtml = '';
            Object.entries(counts).forEach(([key, count]) => {
                const [tournament, season] = key.split('|');
                trophiesListHtml += `
                    <div style="margin-top:8px; color:#e2e8f0;">
                        🏆 ${tournament} <span style="color:#94a3b8;">(${season})</span>
                        <strong> ${count} ${count === 1 ? 'título' : 'títulos'}</strong>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="p-name" style="font-size:18px; color:#f8fafc;">
                    🏆 ${capitalizedName}
                </div>
                <div style="margin-top:10px; color:#cbd5e1;">
                    ${trophiesListHtml}
                </div>
                <div style="margin-top:12px; font-weight:bold; color:#facc15;">
                    Total de títulos: ${trophies.length}
                </div>
            `;
        }

        titlesGalleryContainer.appendChild(card);
    });
}

// Excluir rodada
window.deleteRoundByTimestamp = function (timestamp) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    let history = getHistoryFromStorage();
    history = history.filter(round => round.timestamp !== timestamp);

    localStorage.setItem('footballRankedScoresV6', JSON.stringify(history));

    refreshSeasonOptions();
    renderNotes();
    calculateLeaderboard();
    renderTitlesGallery();
};

// Limpa o formulário
function clearForm() {
    players.forEach(player => {
        const ptsInput = document.getElementById(`pts-${player}`);
        const rankSelect = document.getElementById(`rank-${player}`);

        if (ptsInput) ptsInput.value = '';
        if (rankSelect) rankSelect.value = '';
    });

    // Mantém a temporada preenchida para facilitar o próximo cadastro
    // (se quiser limpar também, descomente a linha abaixo)
    // seasonInput.value = '';
}