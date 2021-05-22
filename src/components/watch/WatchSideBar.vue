<template>
    <div>
        <template v-if="video.songcount">
            <v-btn icon small @click="showDetailed = !showDetailed" class="float-right mr-2"
                ><v-icon small> {{ mdiTimerOutline }} </v-icon></v-btn
            >
            <div class="text-overline ma-2">
                {{ relationI18N("songs") }}
            </div>
            <!-- Match the same structure as VideoCardList -->
            <v-container class="py-0">
                <v-row>
                    <v-list dense>
                        <song-item
                            :detailed="showDetailed"
                            v-for="(song, idx) in songList"
                            :song="song"
                            :key="song.name + song.video_id + idx"
                            @play="$emit('timeJump', song.start)"
                            @playNow="$store.commit('music/skipTo', idx)"
                            :hoverIcon="icons.mdiPlay"
                            style="width: 100%"
                        ></song-item>
                    </v-list>
                </v-row>
            </v-container>
        </template>
        <template v-for="relation in Object.keys(related)">
            <template v-if="related[relation].length">
                <div class="text-overline ma-2 related-title" :key="`${relation}-title`">
                    {{ relationI18N(relation) }}
                    <div class="relation-sort-by">
                        <v-select dense :items="options.sort" :label="$t('views.search.sortByLabel')"></v-select>
                    </div>
                </div>
                <VideoCardList
                    :key="`${relation}-videos`"
                    :videos="sortRelation(related[relation], 'titleZA')"
                    horizontal
                    includeChannel
                    :cols="{
                        lg: 12,
                        md: 4,
                        cols: 12,
                        sm: 6,
                    }"
                    dense
                >
                </VideoCardList>
            </template>
        </template>
        <!-- <template v-if="totalRelations === 0">
            No clips or related videos yet...
        </template> -->
    </div>
</template>

<script lang="ts">
import VideoCardList from "@/components/video/VideoCardList.vue";
import { mdiTimerOutline } from "@mdi/js";

export default {
    name: "WatchSideBar",
    components: {
        VideoCardList,
        SongItem: () => import("@/components/media/SongItem.vue"),
    },
    props: {
        video: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            showDetailed: false,
            mdiTimerOutline,
            options: {
                sort: [
                    {
                        text: this.$t("views.search.sort.none"),
                        value: "none",
                    },
                    {
                        text: this.$t("views.search.sort.newest"),
                        value: "newest",
                    },
                    {
                        text: this.$t("views.search.sort.oldest"),
                        value: "oldest",
                    },
                    {
                        text: this.$t("views.search.sort.titleAZ"),
                        value: "titleAZ",
                    },
                    {
                        text: this.$t("views.search.sort.titleZA"),
                        value: "titleZA",
                    },
                ],
            },
        };
    },
    computed: {
        // totalRelations() {
        //     return Object.values(this.related).map(r => r.length).reduce((a, b) => a+b);
        // }
        related() {
            return {
                simulcasts: this.video.simulcasts || [],
                clips:
                    (this.video.clips &&
                        this.video.clips.filter((x) => this.$store.state.settings.clipLangs.includes(x.lang))) ||
                    [],
                sources: this.video.sources || [],
                refers: this.video.refers || [],
                recommendations: (this.video.recommendations && this.video.recommendations.slice(0, 10)) || [],
            };
        },
        songList() {
            if (this.video && this.video.songs) {
                return this.video.songs
                    .map((song) => {
                        return {
                            ...song,
                            video_id: this.video.id,
                            channel_id: this.video.channel.id,
                            channel: this.video.channel,
                        };
                    })
                    .sort((a, b) => a.start - b.start);
            }
            return [];
        },
    },
    mounted() {
        this.$nextTick(this.updateSongs);
    },
    methods: {
        relationI18N(relation) {
            switch (relation) {
                case "clips":
                    return this.$t("component.relatedVideo.clipsLabel");
                case "simulcasts":
                    return this.$t("component.relatedVideo.simulcastsLabel");
                case "refers":
                    return this.$t("component.relatedVideo.refersLabel");
                case "sources":
                    return this.$t("component.relatedVideo.sourcesLabel");
                case "recommendations":
                    return this.$t("component.relatedVideo.recommendationsLabel");
                case "songs":
                    return this.$t("component.relatedVideo.songsLabel");
                default:
                    return "";
            }
        },
        sortRelation(list, relation) {
            switch (relation) {
                case "none":
                    return list;
                case "newest":
                    return list.sort((a, b) => {
                        return a.available_at > b.available_at ? -1 : 1;
                    });
                case "oldest":
                    return list.sort((a, b) => {
                        return a.available_at < b.available_at ? -1 : 1;
                    });
                case "titleAZ":
                    return list.sort((a, b) => {
                        const titleA = a.title.toUpperCase();
                        const titleB = b.title.toUpperCase();
                        if (titleA < titleB) {
                            return -1;
                        }
                        return titleA > titleB ? 1 : 0;
                    });
                case "titleZA":
                    return list.sort((a, b) => {
                        const titleA = a.title.toUpperCase();
                        const titleB = b.title.toUpperCase();
                        if (titleA > titleB) {
                            return -1;
                        }
                        return titleA < titleB ? 1 : 0;
                    });
                default:
                    return list;
            }
        },
    },
};
</script>

<style>
.related-title {
    padding-top: 1em;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
.relation-sort-by {
    padding-left: 1em;
    max-width: 70%;
}
</style>
