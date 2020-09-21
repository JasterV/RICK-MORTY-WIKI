var ENDPOINT = "https://rickandmortyapi.com/api/";

var controller = {
    next: null,
    episodes: {},
    characters: {},
    locations: {},
}

$(function () {
    axios.get(ENDPOINT).then(function (result) {
        var routes = result.data;
        controller.next = routes.episodes;
        loadNextPage().then(function () {
            showEpisode(1);
        });
    });
    /* EVENT LISTENERS */
    $("#load-more").click(loadNextPage);
    $(".episodes").on("click", "li", function (e) {
        var episode = $(e.target).attr("data-episode");
        var currentEpisode = $('[role="main"]').attr("data-episode");
        if(episode != currentEpisode) 
            showEpisode(episode);
    });
});

/* AJAX FUNCTIONS */
function getData(url) {
    return axios.get(url).then(function (result) {
        return result.data;
    });
}

function getAll(arr) {
    return axios.all(
        arr.map(function (url) {
            return getData(url);
        })
    );
}

/* PAGES FUNCTIONS */

function loadNextPage() {
    if (controller.next == null) return;
    return getData(controller.next).then(function (page) {
        controller.next = page.info.next;
        page.results.forEach(function (episode) {
            controller.episodes[episode.id] = episode;
            $(".episodes").append($('<li data-episode="' + episode.id + '">Episode ' + episode.id + '</li>'))
        });

    });
}

/* EPISODES FUNCTIONS */

function showEpisode(id) {
    var episode = controller.episodes[id];
    $('[role="main"]').empty();
    $('[role="main"]').append(createEpisodeTemplate(episode));
    $('[role="main"]').attr("data-episode", episode.id);
    loadEpisodeCharacters(episode.id);
}

function loadEpisodeCharacters(episodeId) {
    getEpisodeCharacters(episodeId).then(function (characters) {
        characters.forEach(function (character) {
            controller.characters[character.id] = character;
            $(".cards-list").append(createCharacterCard(character));
        });
    });
}

function createEpisodeTemplate(episode) {
    return $("<h1>" + episode.name + "</h1>" +
        "<p class=\"subtitle\"> " + episode.air_date + " <strong>" + episode.episode + "</strong></p>" +
        "<div class=\"cards-list\"></div>");
}

/* CHARACTERS FUNCTIONS */

function getEpisodeCharacters(episodeId) {
    var episode = controller.episodes[episodeId];
    var visiteds = [], urls = [];
    for(var i = 0; i < episode.characters.length; i++) {
        var splited = episode.characters[i].split('/');
        var id = splited[splited.length - 1];
        if(id in controller.characters)
            visiteds.push(controller.characters[id]);
        else
            urls.push(episode.characters[i]);
    }
    return getAll(urls).then(function(characters) {
        return visiteds.concat(characters);
    });
}

function createCharacterCard(character) {
    return $("<div class=\"character-card\"><img src=\"" + character.image +
        "\"/><h3>" + character.name + "</h3><p>" +
        character.species + " <strong>| " +
        character.status + "</strong></p> </div>");
}
                 
                 
                 
                 